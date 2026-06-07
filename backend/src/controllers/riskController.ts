import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

/**
 * Retrieves the complete Risk Register including signal stats, drug details, owner profile, and CAPA tasks.
 */
export async function getRisks(req: AuthenticatedRequest, res: Response) {
  try {
    const risks = await prisma.riskRegister.findMany({
      include: {
        signal: {
          include: { drug: true }
        },
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        capaTrackings: {
          orderBy: { updatedAt: 'desc' }
        }
      },
      orderBy: { riskScore: 'desc' }
    });

    return res.status(200).json(risks);
  } catch (error: any) {
    console.error('getRisks error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

/**
 * Escalates a safety signal to the Risk Register.
 */
export async function escalateSignal(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      signalId,
      riskCategory,
      severityScore,
      likelihoodScore,
      capaDescription,
      ownerId
    } = req.body;

    const signalIdText = String(signalId || '');
    const ownerIdText = String(ownerId || '');

    if (!signalIdText || !riskCategory || !severityScore || !likelihoodScore || !capaDescription || !ownerIdText) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify signal exists
    const signal = await prisma.signalDetection.findUnique({
      where: { id: signalIdText },
      include: { drug: true }
    });

    if (!signal) {
      return res.status(404).json({ error: 'Signal not found' });
    }

    // Verify owner exists
    const owner = await prisma.user.findUnique({ where: { id: ownerIdText } });
    if (!owner) {
      return res.status(400).json({ error: 'Assigned owner user not found' });
    }

    const severityVal = parseInt(severityScore);
    const likelihoodVal = parseInt(likelihoodScore);
    const riskScore = severityVal * likelihoodVal;

    // Use Prisma transaction to create register, update signal, log history, create CAPA, and create notifications
    const result = await prisma.$transaction(async (tx: any) => {
      // Create Risk Register
      const risk = await tx.riskRegister.create({
        data: {
          signalId: signalIdText,
          riskCategory,
          severityScore: severityVal,
          likelihoodScore: likelihoodVal,
          riskScore,
          capaDescription,
          capaStatus: 'Open',
          ownerId: ownerIdText
        }
      });

      // Update Signal Status to Safety Review
      const prevStatus = signal.status;
      await tx.signalDetection.update({
        where: { id: signalIdText },
        data: { status: 'Safety Review' }
      });

      // Log Signal History
      await tx.signalHistory.create({
        data: {
          signalId: signalIdText,
          previousStatus: prevStatus,
          newStatus: 'Safety Review',
          modifiedById: userId,
          notes: `Signal escalated to Risk Register (Category: ${riskCategory}, Score: ${riskScore}).`
        }
      });

      // Create initial CAPA tracking record
      await tx.capaTracking.create({
        data: {
          riskId: risk.id,
          actionTaken: 'Initial risk register entry logged. CAPA plan defined.',
          status: 'Open',
          targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
          updatedById: userId
        }
      });

      // In-app Notification for risk owner
      await tx.notification.create({
        data: {
          userId: ownerIdText,
          title: 'New Risk Ownership Assigned',
          message: `You have been assigned as the owner of safety risk: ${signal.drug.genericName} - ${signal.reactionPtName}. Prioritization Score: ${riskScore}.`,
          type: 'warning'
        }
      });

      return risk;
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'Escalate Signal',
        resource: 'RiskRegister',
        resourceId: result.id,
        details: `Escalated signal ${signalIdText} to risk register with score ${riskScore}.`,
        ipAddress: req.ip
      }
    });

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('escalateSignal error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

/**
 * Updates risk register parameters (severity, likelihood, description, owner).
 */
export async function updateRisk(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      riskCategory,
      severityScore,
      likelihoodScore,
      capaDescription,
      capaStatus,
      ownerId
    } = req.body;

    const existingRisk = await prisma.riskRegister.findUnique({ where: { id } });
    if (!existingRisk) {
      return res.status(404).json({ error: 'Risk register entry not found' });
    }

    const severityVal = severityScore !== undefined ? parseInt(severityScore) : existingRisk.severityScore;
    const likelihoodVal = likelihoodScore !== undefined ? parseInt(likelihoodScore) : existingRisk.likelihoodScore;
    const riskScore = severityVal * likelihoodVal;

    const updatedRisk = await prisma.riskRegister.update({
      where: { id },
      data: {
        riskCategory: riskCategory || existingRisk.riskCategory,
        severityScore: severityVal,
        likelihoodScore: likelihoodVal,
        riskScore,
        capaDescription: capaDescription || existingRisk.capaDescription,
        capaStatus: capaStatus || existingRisk.capaStatus,
        ownerId: ownerId || existingRisk.ownerId
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'Update Risk Register',
        resource: 'RiskRegister',
        resourceId: id,
        details: `Updated risk register entry parameters. New Risk Score: ${riskScore}.`,
        ipAddress: req.ip
      }
    });

    return res.status(200).json(updatedRisk);
  } catch (error: any) {
    console.error('updateRisk error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

/**
 * Updates or appends a CAPA action and changes its status.
 */
export async function updateCapa(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id); // CAPA tracking ID
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { actionTaken, status, targetDate, completed } = req.body;

    if (!status || !actionTaken) {
      return res.status(400).json({ error: 'Status and actionTaken description are required' });
    }

    const existingCapa = await prisma.capaTracking.findUnique({ where: { id } });
    if (!existingCapa) {
      return res.status(404).json({ error: 'CAPA tracking record not found' });
    }

    const completedDate = completed === true ? new Date() : null;

    const updatedCapa = await prisma.capaTracking.update({
      where: { id },
      data: {
        actionTaken,
        status,
        targetDate: targetDate ? new Date(targetDate) : existingCapa.targetDate,
        completedDate,
        updatedById: userId
      }
    });

    // If CAPA is closed, check if all CAPAs for the risk are closed to auto-close risk register status
    if (status === 'Closed') {
      const remainingOpenCapas = await prisma.capaTracking.count({
        where: {
          riskId: existingCapa.riskId,
          status: { not: 'Closed' }
        }
      });

      if (remainingOpenCapas === 0) {
        await prisma.riskRegister.update({
          where: { id: existingCapa.riskId },
          data: { capaStatus: 'Closed' }
        });
      }
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'Update CAPA Task',
        resource: 'CapaTracking',
        resourceId: id,
        details: `Updated CAPA action status to ${status}.`,
        ipAddress: req.ip
      }
    });

    return res.status(200).json(updatedCapa);
  } catch (error: any) {
    console.error('updateCapa error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

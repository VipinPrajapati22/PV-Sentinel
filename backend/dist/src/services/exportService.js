"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const exceljs_1 = require("exceljs");
const pdfkit_1 = __importDefault(require("pdfkit"));
const stream_1 = require("stream");
class ExportService {
    /**
     * Generates a multi-sheet Excel workbook from reports and signals data.
     */
    static async generateExcel(reports, signals, stats) {
        const workbook = new exceljs_1.Workbook();
        // Define shared styles
        const titleFont = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
        const headerFont = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        const headerFill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1A365D' } // Dark Navy
        };
        const thinBorder = {
            top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
        };
        // ----- SHEET 1: SUMMARY -----
        const wsSummary = workbook.addWorksheet('Summary');
        wsSummary.views = [{ showGridLines: true }];
        // Title Banner
        wsSummary.mergeCells('A1:D1');
        const titleCell = wsSummary.getCell('A1');
        titleCell.value = 'PHARMACOVIGILANCE SAFETY REPORT';
        titleCell.font = titleFont;
        titleCell.fill = headerFill;
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        wsSummary.getRow(1).height = 40;
        // Date
        wsSummary.getCell('A2').value = `Generated: ${new Date().toLocaleString()}`;
        wsSummary.getCell('A2').font = { italic: true };
        // KPI Cards
        const kpiRows = [
            ['Total Spontaneous ADR Reports', reports.length],
            ['Total Safety Signals Detected', stats.total || 0],
            ['Strong Signals (Evans Criteria)', stats.strong || 0],
            ['Moderate Signals (High Priority)', stats.moderate || 0],
            ['Weak Signals (Under Review)', stats.weak || 0],
            ['Average Proportional Reporting Ratio (PRR)', stats.avgPrr || 0],
            ['Maximum Detected PRR Value', stats.maxPrr || 0]
        ];
        wsSummary.getCell('A4').value = 'KEY SAFETY METRICS';
        wsSummary.getCell('A4').font = { size: 12, bold: true };
        let currentRow = 5;
        for (const [label, val] of kpiRows) {
            wsSummary.getCell(`A${currentRow}`).value = label;
            wsSummary.getCell(`B${currentRow}`).value = val;
            wsSummary.getCell(`A${currentRow}`).border = thinBorder;
            wsSummary.getCell(`B${currentRow}`).border = thinBorder;
            wsSummary.getCell(`B${currentRow}`).alignment = { horizontal: 'right' };
            wsSummary.getCell(`A${currentRow}`).font = { name: 'Arial', size: 10 };
            wsSummary.getCell(`B${currentRow}`).font = { name: 'Arial', size: 10, bold: true };
            currentRow++;
        }
        wsSummary.getColumn(1).width = 40;
        wsSummary.getColumn(2).width = 15;
        // ----- SHEET 2: ALL REPORTS -----
        const wsReports = workbook.addWorksheet('All Spontaneous Reports');
        wsReports.views = [{ showGridLines: true }];
        const reportHeaders = [
            'Report ID', 'Patient Age', 'Age Unit', 'Gender', 'Suspected Drug',
            'Adverse Event (MedDRA PT)', 'Severity', 'Seriousness', 'Causality (WHO-UMC)',
            'Clinical Outcome', 'Reporter Name', 'Report Date'
        ];
        wsReports.getRow(1).values = reportHeaders;
        wsReports.getRow(1).height = 25;
        wsReports.getRow(1).eachCell((cell) => {
            cell.font = headerFont;
            cell.fill = headerFill;
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = thinBorder;
        });
        reports.forEach((rep, index) => {
            const rowNum = index + 2;
            const rowValues = [
                rep.id, rep.patientAge, rep.patientAgeUnit, rep.patientGender, rep.suspectedDrug,
                rep.reaction, rep.severity, rep.seriousness, rep.causality,
                rep.outcome, rep.reporterName, new Date(rep.reportDate).toLocaleDateString()
            ];
            wsReports.getRow(rowNum).values = rowValues;
            wsReports.getRow(rowNum).eachCell((cell) => {
                cell.border = thinBorder;
                cell.font = { name: 'Arial', size: 9 };
            });
        });
        reportHeaders.forEach((h, i) => {
            wsReports.getColumn(i + 1).width = i === 5 ? 25 : i === 0 ? 36 : 15;
        });
        // ----- SHEET 3: DETECTED SIGNALS -----
        const wsSignals = workbook.addWorksheet('Safety Signals');
        wsSignals.views = [{ showGridLines: true }];
        const signalHeaders = [
            'Suspected Drug', 'Adverse Reaction', 'PRR', 'ROR', 'Chi-Square',
            '95% CI Lower', '95% CI Upper', 'Information Component (IC)',
            'Composite Signal Score', 'Signal Strength', 'Risk Trend', 'Escalation Status'
        ];
        wsSignals.getRow(1).values = signalHeaders;
        wsSignals.getRow(1).height = 25;
        wsSignals.getRow(1).eachCell((cell) => {
            cell.font = headerFont;
            cell.fill = headerFill;
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = thinBorder;
        });
        // Color code strength fills
        const redFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
        const redFont = { color: { argb: 'FF9C0006' }, bold: true };
        const yellowFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } };
        const yellowFont = { color: { argb: 'FF9C6500' }, bold: true };
        const greenFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
        const greenFont = { color: { argb: 'FF006100' } };
        signals.forEach((sig, index) => {
            const rowNum = index + 2;
            const rowValues = [
                sig.drugName, sig.reactionPtName, sig.prr, sig.ror, sig.chiSquare,
                sig.ciLower, sig.ciUpper, sig.informationComponent, sig.signalScore,
                sig.strength, sig.trend, sig.status
            ];
            wsSignals.getRow(rowNum).values = rowValues;
            const row = wsSignals.getRow(rowNum);
            row.eachCell((cell, colIndex) => {
                cell.border = thinBorder;
                cell.font = { name: 'Arial', size: 9 };
                // Align stats
                if (colIndex >= 3 && colIndex <= 9) {
                    cell.alignment = { horizontal: 'right' };
                }
                // Highlight strength
                if (colIndex === 10) {
                    cell.alignment = { horizontal: 'center' };
                    if (sig.strength === 'Strong') {
                        cell.fill = redFill;
                        cell.font = { name: 'Arial', size: 9, ...redFont };
                    }
                    else if (sig.strength === 'Moderate') {
                        cell.fill = yellowFill;
                        cell.font = { name: 'Arial', size: 9, ...yellowFont };
                    }
                    else {
                        cell.fill = greenFill;
                        cell.font = { name: 'Arial', size: 9, ...greenFont };
                    }
                }
            });
        });
        signalHeaders.forEach((h, i) => {
            wsSignals.getColumn(i + 1).width = i < 2 ? 22 : 15;
        });
        // ----- SHEET 4: DRUG-EFFECT PIVOT MATRIX -----
        const wsMatrix = workbook.addWorksheet('Drug-Effect Matrix');
        wsMatrix.views = [{ showGridLines: true }];
        wsMatrix.getCell('A1').value = 'DRUG-EFFECT SIGNAL PRR MATRIX';
        wsMatrix.getCell('A1').font = { size: 12, bold: true };
        const uniqueDrugs = Array.from(new Set(signals.map(s => s.drugName))).sort();
        const uniqueReactions = Array.from(new Set(signals.map(s => s.reactionPtName))).sort();
        // Headers (Reactions)
        uniqueReactions.forEach((rx, colIdx) => {
            const cell = wsMatrix.getCell(3, colIdx + 2);
            cell.value = rx;
            cell.fill = headerFill;
            cell.font = headerFont;
            cell.alignment = { textRotation: 45, horizontal: 'center', vertical: 'middle' };
            cell.border = thinBorder;
        });
        wsMatrix.getRow(3).height = 60;
        // Rows (Drugs)
        uniqueDrugs.forEach((drg, rowIdx) => {
            const cell = wsMatrix.getCell(rowIdx + 4, 1);
            cell.value = drg;
            cell.font = { name: 'Arial', size: 10, bold: true };
            cell.border = thinBorder;
            // Populate PRRs
            uniqueReactions.forEach((rx, colIdx) => {
                const matchingSignal = signals.find(s => s.drugName === drg && s.reactionPtName === rx);
                const dataCell = wsMatrix.getCell(rowIdx + 4, colIdx + 2);
                dataCell.border = thinBorder;
                if (matchingSignal) {
                    dataCell.value = matchingSignal.prr;
                    dataCell.alignment = { horizontal: 'right' };
                    if (matchingSignal.strength === 'Strong') {
                        dataCell.fill = redFill;
                        dataCell.font = { name: 'Arial', size: 9, ...redFont };
                    }
                    else if (matchingSignal.strength === 'Moderate') {
                        dataCell.fill = yellowFill;
                        dataCell.font = { name: 'Arial', size: 9, ...yellowFont };
                    }
                    else {
                        dataCell.fill = greenFill;
                        dataCell.font = { name: 'Arial', size: 9, ...greenFont };
                    }
                }
                else {
                    dataCell.value = '-';
                    dataCell.alignment = { horizontal: 'center' };
                    dataCell.font = { name: 'Arial', size: 9, color: { argb: 'FFD3D3D3' } };
                }
            });
        });
        wsMatrix.getColumn(1).width = 25;
        uniqueReactions.forEach((rx, idx) => {
            wsMatrix.getColumn(idx + 2).width = 15;
        });
        // Write workbook to buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    }
    /**
     * Generates a clinical safety signal evaluation PDF report.
     */
    static generateSignalPdf(signal, expertInterpretation, demographics) {
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({ margin: 50, size: 'A4' });
            const stream = new stream_1.PassThrough();
            const buffers = [];
            stream.on('data', (chunk) => buffers.push(chunk));
            stream.on('end', () => resolve(Buffer.concat(buffers)));
            stream.on('error', (err) => reject(err));
            doc.pipe(stream);
            // --- HEADER BANNER ---
            doc.rect(50, 40, 495, 60).fill('#1A365D');
            doc.fillColor('#FFFFFF')
                .font('Helvetica-Bold')
                .fontSize(16)
                .text('PHARMACOVIGILANCE SAFETY ALERT SYSTEM', 65, 55);
            doc.font('Helvetica-Oblique')
                .fontSize(10)
                .text('CONFIDENTIAL - FOR CLINICAL SAFETY REVIEW ONLY', 65, 78);
            // Metadata block
            doc.fillColor('#333333')
                .font('Helvetica')
                .fontSize(9)
                .text(`Report Date: ${new Date().toLocaleDateString()}`, 400, 110, { align: 'right' });
            // Title
            doc.font('Helvetica-Bold')
                .fontSize(18)
                .fillColor('#2C3E50')
                .text('Safety Signal Evaluation Dossier', 50, 125);
            doc.moveDown(0.5);
            doc.strokeColor('#BDC3C7')
                .lineWidth(1)
                .moveTo(50, doc.y)
                .lineTo(545, doc.y)
                .stroke();
            doc.moveDown(1);
            // --- TARGET DRUG & ADVERSE REACTION ---
            const metadataY = doc.y;
            doc.rect(50, metadataY, 495, 45).fill('#EDF2F7');
            doc.fillColor('#2D3748')
                .font('Helvetica-Bold')
                .fontSize(11)
                .text('SUSPECTED DRUG (GENERIC):', 65, metadataY + 10)
                .font('Helvetica')
                .text(signal.drugName, 260, metadataY + 10)
                .font('Helvetica-Bold')
                .text('ADVERSE EVENT (MEDDRA PT):', 65, metadataY + 25)
                .font('Helvetica')
                .text(signal.reactionPtName, 260, metadataY + 25);
            doc.moveDown(2);
            // --- SECTION 1: SIGNAL DETECTION METRICS ---
            doc.fillColor('#1A365D')
                .font('Helvetica-Bold')
                .fontSize(12)
                .text('1. Quantitative Disproportionality Metrics');
            doc.moveDown(0.5);
            const tableTop = doc.y;
            const colWidths = [120, 120, 120, 120];
            const rowHeight = 18;
            // Draw table headers
            doc.rect(50, tableTop, 495, rowHeight).fill('#2B6CB0');
            doc.fillColor('#FFFFFF')
                .font('Helvetica-Bold')
                .fontSize(9)
                .text('Metric', 60, tableTop + 5)
                .text('Calculated Value', 180, tableTop + 5)
                .text('Signal Threshold', 300, tableTop + 5)
                .text('Status', 420, tableTop + 5);
            const metricsRows = [
                ['PRR', signal.prr.toFixed(2), '>= 2.0', signal.prr >= 2 ? 'Significant' : 'Normal'],
                ['ROR', signal.ror.toFixed(2), '>= 1.0', signal.ror >= 1 ? 'Elevated' : 'Normal'],
                ['Chi-Square', signal.chiSquare.toFixed(2), '>= 3.84 (p < 0.05)', signal.chiSquare >= 3.84 ? 'Significant' : 'Normal'],
                ['95% Confidence Interval', `[${signal.ciLower.toFixed(2)} - ${signal.ciUpper.toFixed(2)}]`, 'Lower limit > 1.0', signal.ciLower > 1 ? 'Significant' : 'Normal'],
                ['Information Component', signal.informationComponent.toFixed(2), '> 0.0 (Positive)', signal.informationComponent > 0 ? 'Significant' : 'Normal'],
                ['Composite Signal Score', signal.signalScore.toFixed(2), 'N/A', `Priority: ${signal.strength}`]
            ];
            metricsRows.forEach((row, i) => {
                const rowY = tableTop + rowHeight + (i * rowHeight);
                // Alternating fill
                if (i % 2 === 0) {
                    doc.rect(50, rowY, 495, rowHeight).fill('#F7FAFC');
                }
                doc.fillColor('#2D3748')
                    .font('Helvetica')
                    .fontSize(8.5)
                    .text(row[0], 60, rowY + 5)
                    .text(row[1], 180, rowY + 5)
                    .text(row[2], 300, rowY + 5)
                    .font(row[3].includes('Significant') || row[3].includes('Priority: Strong') ? 'Helvetica-Bold' : 'Helvetica')
                    .fillColor(row[3].includes('Significant') || row[3].includes('Priority: Strong') ? '#C53030' : '#2D3748')
                    .text(row[3], 420, rowY + 5);
            });
            doc.moveDown(7.5);
            // --- SECTION 2: BIOLOGICAL & DEMOGRAPHIC SUMMARY ---
            doc.fillColor('#1A365D')
                .font('Helvetica-Bold')
                .fontSize(12)
                .text('2. Case Patient Cohort Demographics');
            doc.moveDown(0.5);
            const demoY = doc.y;
            // Left box: Gender & Age
            doc.rect(50, demoY, 240, 95).fill('#F7FAFC').stroke('#E2E8F0');
            doc.fillColor('#2D3748').font('Helvetica-Bold').fontSize(9).text('Gender Distribution', 60, demoY + 8);
            let gOffset = 22;
            Object.entries(demographics.genderDist).forEach(([gender, count]) => {
                doc.font('Helvetica').fontSize(8).text(`• ${gender}: ${count} reports`, 65, demoY + gOffset);
                gOffset += 11;
            });
            doc.font('Helvetica-Bold').fontSize(9).text('Age Categories', 170, demoY + 8);
            let aOffset = 22;
            Object.entries(demographics.ageDist).forEach(([age, count]) => {
                doc.font('Helvetica').fontSize(8).text(`• ${age}: ${count} cases`, 175, demoY + aOffset);
                aOffset += 11;
            });
            // Right box: Severity & Reporter Types
            doc.rect(305, demoY, 240, 95).fill('#F7FAFC').stroke('#E2E8F0');
            doc.fillColor('#2D3748').font('Helvetica-Bold').fontSize(9).text('Severity Breakdown', 315, demoY + 8);
            let sOffset = 22;
            Object.entries(demographics.severityDist).forEach(([sev, count]) => {
                doc.font('Helvetica').fontSize(8).text(`• ${sev}: ${count}`, 320, demoY + sOffset);
                sOffset += 11;
            });
            doc.font('Helvetica-Bold').fontSize(9).text('Reporter Types', 430, demoY + 8);
            let rOffset = 22;
            Object.entries(demographics.reporterDist).forEach(([rep, count]) => {
                doc.font('Helvetica').fontSize(8).text(`• ${rep}: ${count}`, 435, demoY + rOffset);
                rOffset += 11;
            });
            doc.moveDown(7.5);
            // --- SECTION 3: EXPERT CLINICAL EVALUATION ---
            doc.fillColor('#1A365D')
                .font('Helvetica-Bold')
                .fontSize(12)
                .text('3. Pharmacovigilance Intelligence & Causality Interpretation');
            doc.moveDown(0.5);
            doc.fillColor('#2D3748')
                .font('Helvetica-Bold')
                .fontSize(9)
                .text('Statistical Evaluation Summary:')
                .font('Helvetica')
                .fontSize(8.5)
                .text(expertInterpretation.statsInterpretation, { align: 'justify' });
            doc.moveDown(0.5);
            // Causality
            doc.font('Helvetica-Bold')
                .text('WHO-UMC Causality Algorithm Consensus:')
                .font('Helvetica')
                .text(`Consensus recommendation: **${expertInterpretation.causality.category}** (Algorithm Confidence: ${Math.round(expertInterpretation.causality.confidence * 100)}%)`)
                .moveDown(0.3);
            doc.fontSize(8);
            expertInterpretation.causality.reasoning.forEach((reason) => {
                doc.text(`  ${reason}`);
            });
            doc.moveDown(0.8);
            // Page Break for CAPA and Executive Summary
            doc.addPage();
            // Header on Page 2
            doc.rect(50, 40, 495, 30).fill('#1A365D');
            doc.fillColor('#FFFFFF')
                .font('Helvetica-Bold')
                .fontSize(11)
                .text(`Safety Evaluation Dossier: ${signal.drugName} & ${signal.reactionPtName}`, 65, 50);
            doc.moveDown(2);
            // --- SECTION 4: RISK ASSESSMENT & CAPA ---
            doc.fillColor('#1A365D')
                .font('Helvetica-Bold')
                .fontSize(12)
                .text('4. Risk Assessment & CAPA Recommendations');
            doc.moveDown(0.5);
            doc.fillColor('#2D3748')
                .font('Helvetica-Bold')
                .fontSize(9)
                .text('Risk Prioritization & Impact Analysis:')
                .font('Helvetica')
                .fontSize(8.5)
                .text(expertInterpretation.riskAssessment, { align: 'justify' });
            doc.moveDown(0.8);
            doc.font('Helvetica-Bold')
                .fontSize(9)
                .text('Corrective and Preventive Actions (CAPA) Required:')
                .moveDown(0.3);
            doc.font('Helvetica')
                .fontSize(8.5);
            expertInterpretation.capaRecommendations.forEach((capa, idx) => {
                doc.text(`[CAPA-${idx + 1}]  ${capa}`, { indent: 15 });
                doc.moveDown(0.3);
            });
            doc.moveDown(1);
            // --- SECTION 5: EXECUTIVE CLINICAL SAFETY NARRATIVE ---
            doc.fillColor('#1A365D')
                .font('Helvetica-Bold')
                .fontSize(12)
                .text('5. Executive Safety Narrative');
            doc.moveDown(0.5);
            doc.rect(50, doc.y, 495, 140).fill('#EDF2F7');
            doc.fillColor('#1A202C')
                .font('Helvetica')
                .fontSize(8)
                .text(expertInterpretation.executiveSummary, 65, doc.y + 10, {
                width: 465,
                align: 'justify',
                lineGap: 3
            });
            // Signature block
            doc.moveDown(10);
            const signatureY = doc.y;
            doc.strokeColor('#CBD5E0')
                .lineWidth(0.5)
                .moveTo(50, signatureY)
                .lineTo(200, signatureY)
                .moveTo(395, signatureY)
                .lineTo(545, signatureY)
                .stroke();
            doc.fillColor('#718096')
                .fontSize(8)
                .text('Clinical Safety Lead Signature', 50, signatureY + 5, { width: 150, align: 'center' })
                .text('Regulatory Officer Signature', 395, signatureY + 5, { width: 150, align: 'center' });
            doc.end();
        });
    }
}
exports.ExportService = ExportService;

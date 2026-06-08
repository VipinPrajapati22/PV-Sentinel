import { Mail, Link, Globe, User } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="page">
      <section className="panel">
        <div className="panel-header">
          <h3>About the Creator</h3>
          <span>PV Sentinel Development Profile</span>
        </div>

        <h1>Vipin Prajapati</h1>

        <p>
          PV Sentinel is an AI-powered pharmacovigilance platform for ADR
          monitoring, signal detection, risk management and drug safety
          intelligence.
        </p>

        <div className="data-table">
          <div className="dt-row">
            <strong>
              <Mail size={18} /> Email
            </strong>
            <span>
              <a href="mailto:vipin22nov@gmail.com">
                vipin22nov@gmail.com
              </a>
            </span>
          </div>

          <div className="dt-row">
            <strong>
              <Link size={18} /> LinkedIn
            </strong>
            <span>
              <a
                href="https://www.linkedin.com/in/vipin-prajapati-5a11a0275"
                target="_blank"
                rel="noopener noreferrer"
              >
                View LinkedIn Profile
              </a>
            </span>
          </div>

          <div className="dt-row">
            <strong>
              <Globe size={18} /> GitHub
            </strong>
            <span>
              <a
                href="https://github.com/VipinPrajapati22"
                target="_blank"
                rel="noopener noreferrer"
              >
                View GitHub Profile
              </a>
            </span>
          </div>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <User size={16} /> Pharmacovigilance • Drug Safety
        </div>
      </section>
    </div>
  );
}
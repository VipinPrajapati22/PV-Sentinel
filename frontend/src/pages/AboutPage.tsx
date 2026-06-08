import {
  Mail,
  Linkedin,
  Github,
  User,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          {/* Header */}
          <div className="mb-8">
            <p className="text-blue-700 font-bold tracking-wide uppercase text-sm mb-3">
              About the Creator
            </p>

            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Vipin Prajapati
            </h1>

            <p className="text-slate-600 text-lg leading-relaxed max-w-4xl">
              Drug Interaction Awareness System is a pharmacy and
              pharmacovigilance portfolio project focused on improving
              medication safety through interaction screening,
              pharmacovigilance monitoring, ADR reporting, and patient
              counseling support.
            </p>
          </div>

          {/* Contact Cards */}
          <div className="space-y-4">
            {/* Email */}
            <a
              href="mailto:vipin22nov@gmail.com"
              className="flex items-center gap-5 p-6 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all bg-white"
            >
              <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-blue-50">
                <Mail className="w-7 h-7 text-blue-700" />
              </div>

              <div>
                <h3 className="font-semibold text-2xl text-slate-900">
                  vipin22nov@gmail.com
                </h3>
                <p className="text-slate-500">Email</p>
              </div>
            </a>

            {/* LinkedIn */}
            <a
              href="www.linkedin.com/in/vipinprajapati22"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-5 p-6 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all bg-white"
            >
              <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-blue-50">
                <Linkedin className="w-7 h-7 text-blue-700" />
              </div>

              <div>
                <h3 className="font-semibold text-2xl text-slate-900">
                  LinkedIn Profile
                </h3>

                <p className="text-slate-500">
                  www.linkedin.com/in/vipin-prajapati-5a11a0275
                </p>
              </div>
            </a>

            {/* GitHub */}
            <a
              href="https://github.com/VipinPrajapati22"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-5 p-6 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all bg-white"
            >
              <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-blue-50">
                <Github className="w-7 h-7 text-blue-700" />
              </div>

              <div>
                <h3 className="font-semibold text-2xl text-slate-900">
                  GitHub Profile
                </h3>

                <p className="text-slate-500">
                  github.com/VipinPrajapati22
                </p>
              </div>
            </a>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-slate-200 flex items-center gap-3">
            <User className="w-5 h-5 text-blue-700" />
            <p className="text-slate-500">
              Pharmacovigilance • Drug Safety • Medication Awareness
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
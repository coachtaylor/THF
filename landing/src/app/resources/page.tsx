import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resources - Trans Health & Fitness',
  description: 'Crisis hotlines, gender affirming care directories, trusted health information, and support resources for trans and LGBTQ+ individuals',
};

export default function Resources() {
  return (
    <main className="min-h-screen bg-background text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">Resources</h1>
        <p className="text-accent-blue mb-12">Trans Health &amp; Fitness</p>

        {/* 24/7 Crisis and Peer Support Hotlines */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">24/7 Crisis and Peer Support Hotlines</h2>
          <p className="text-text-secondary mb-6">
            These services are independent of TransFitness. They are run by trained counselors and peers who understand LGBTQ+ and trans experiences.
          </p>

          <div className="space-y-6">
            {/* 988 Lifeline */}
            <div className="p-5 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-xl font-medium mb-2 text-accent-blue">988 Suicide &amp; Crisis Lifeline</h3>
              <p className="text-text-secondary mb-2">United States</p>
              <p className="text-text-secondary mb-3">Call or text 988 or use chat via the website.</p>
              <a
                href="https://988lifeline.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-blue hover:underline"
              >
                988lifeline.org
              </a>
            </div>

            {/* Trans Lifeline */}
            <div className="p-5 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-xl font-medium mb-2 text-accent-blue">Trans Lifeline</h3>
              <p className="text-text-secondary mb-3">Trans-led peer support by and for trans people.</p>
              <ul className="text-text-secondary mb-3 space-y-1">
                <li>US: 877-565-8860</li>
                <li>Canada: 877-330-6366</li>
              </ul>
              <a
                href="https://translifeline.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-blue hover:underline"
              >
                translifeline.org
              </a>
            </div>

            {/* The Trevor Project */}
            <div className="p-5 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-xl font-medium mb-2 text-accent-blue">The Trevor Project</h3>
              <p className="text-text-secondary mb-3">24/7 crisis support for LGBTQ+ young people (under ~25) via phone, text, or chat.</p>
              <ul className="text-text-secondary mb-3 space-y-1">
                <li>Call: 1-866-488-7386</li>
                <li>Text: START to 678-678</li>
                <li>
                  Chat or text from their site:{' '}
                  <a
                    href="https://www.thetrevorproject.org/get-help"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-blue hover:underline"
                  >
                    thetrevorproject.org/get-help
                  </a>
                </li>
              </ul>
              <a
                href="https://www.thetrevorproject.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-blue hover:underline"
              >
                thetrevorproject.org
              </a>
            </div>

            {/* LGBT National Help Center */}
            <div className="p-5 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-xl font-medium mb-2 text-accent-blue">LGBT National Help Center</h3>
              <p className="text-text-secondary mb-3">Multiple hotlines and online chat for LGBTQ+ people, youth, and seniors.</p>
              <a
                href="https://lgbthotline.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-blue hover:underline"
              >
                lgbthotline.org
              </a>
            </div>
          </div>

          <p className="text-text-tertiary mt-6 text-sm">
            Outside the United States and Canada, please search for &quot;LGBTQ crisis hotline&quot; plus your country or region, or contact your local health services to find emergency and mental health support near you.
          </p>
        </section>

        {/* Finding Gender Affirming Medical Care */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Finding Gender Affirming Medical Care</h2>
          <p className="text-text-secondary mb-6">
            We strongly encourage you to work with trans-competent, gender affirming healthcare providers for hormones, surgery, mental health, and primary care. These directories can help you find providers who understand LGBTQ+ health.
          </p>

          <div className="space-y-6">
            {/* LGBTQ+ Healthcare Directory */}
            <div className="p-5 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-xl font-medium mb-2 text-accent-blue">LGBTQ+ Healthcare Directory</h3>
              <p className="text-text-secondary mb-3">Free searchable directory of LGBTQ+ affirming providers in the US and Canada. A partnership between GLMA and Tegan and Sara Foundation.</p>
              <a
                href="https://lgbtqhealthcaredirectory.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-blue hover:underline"
              >
                lgbtqhealthcaredirectory.org
              </a>
            </div>

            {/* OutCare Health */}
            <div className="p-5 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-xl font-medium mb-2 text-accent-blue">OutCare Health – OutList Directory</h3>
              <p className="text-text-secondary mb-3">Large directory of LGBTQ+ affirming providers plus education and community resources.</p>
              <div className="space-y-1">
                <a
                  href="https://www.outcarehealth.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-blue hover:underline block"
                >
                  outcarehealth.org
                </a>
                <a
                  href="https://www.outcarehealth.org/outlist"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-blue hover:underline block"
                >
                  OutList Search
                </a>
              </div>
            </div>

            {/* Planned Parenthood */}
            <div className="p-5 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-xl font-medium mb-2 text-accent-blue">Planned Parenthood – Gender Affirming Care</h3>
              <p className="text-text-secondary mb-3">Many health centers offer hormone therapy and related gender affirming services.</p>
              <a
                href="https://www.plannedparenthood.org/get-care/our-services/gender-affirming-care"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-blue hover:underline"
              >
                plannedparenthood.org/gender-affirming-care
              </a>
            </div>
          </div>

          <p className="text-text-tertiary mt-6 text-sm">
            You can also search for &quot;[your city] LGBTQ center&quot; or &quot;[your city] trans clinic&quot; to find local services, support groups, and referrals.
          </p>
        </section>

        {/* Trusted Information About Trans Health */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Trusted Information About Trans Health</h2>
          <p className="text-text-secondary mb-6">
            Trans health is complex, and you deserve information that is grounded in research and real clinical experience. These resources are designed for patients and providers and can be a helpful starting point for questions about hormones, surgery, and general health.
          </p>

          <div className="space-y-6">
            {/* WPATH */}
            <div className="p-5 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-xl font-medium mb-2 text-accent-blue">WPATH Standards of Care, Version 8</h3>
              <p className="text-text-secondary mb-3">International clinical guidelines many providers use for gender affirming care.</p>
              <a
                href="https://wpath.org/publications/soc8"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-blue hover:underline"
              >
                wpath.org/publications/soc8
              </a>
            </div>

            {/* UCSF Guidelines */}
            <div className="p-5 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-xl font-medium mb-2 text-accent-blue">UCSF Gender Affirming Health Program – Guidelines</h3>
              <p className="text-text-secondary mb-3">Detailed, free online guidelines for primary and gender affirming care of trans and nonbinary people.</p>
              <div className="space-y-1">
                <a
                  href="https://transcare.ucsf.edu/guidelines"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-blue hover:underline block"
                >
                  transcare.ucsf.edu/guidelines
                </a>
                <a
                  href="https://transcare.ucsf.edu/welcome"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-blue hover:underline block"
                >
                  Program Home
                </a>
              </div>
            </div>

            {/* UCSF Center of Excellence */}
            <div className="p-5 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-xl font-medium mb-2 text-accent-blue">UCSF Center of Excellence for Transgender Health</h3>
              <p className="text-text-secondary mb-3">Education, research, and resources focused on advancing trans health equity.</p>
              <a
                href="https://transhealth.ucsf.edu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-blue hover:underline"
              >
                transhealth.ucsf.edu
              </a>
            </div>

            {/* OutCare Resources */}
            <div className="p-5 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-xl font-medium mb-2 text-accent-blue">OutCare Health – Patient &amp; Education Resources</h3>
              <p className="text-text-secondary mb-3">LGBTQ+ health education, provider training, and patient resources.</p>
              <a
                href="https://www.outcarehealth.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-blue hover:underline"
              >
                outcarehealth.org
              </a>
            </div>
          </div>
        </section>

        {/* Support for Families and Allies */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Support for Families and Allies</h2>
          <p className="text-text-secondary mb-6">
            If you are a parent, partner, or friend looking for ways to support a trans or nonbinary person in your life, these organizations offer education and community.
          </p>

          <div className="space-y-6">
            {/* PFLAG */}
            <div className="p-5 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-xl font-medium mb-2 text-accent-blue">PFLAG</h3>
              <p className="text-text-secondary mb-3">The largest US organization for families, allies, and LGBTQ+ people, with local chapters and support groups.</p>
              <div className="space-y-1">
                <a
                  href="https://pflag.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-blue hover:underline block"
                >
                  pflag.org
                </a>
                <a
                  href="https://pflag.org/findachapter"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-blue hover:underline block"
                >
                  Find a Local Chapter
                </a>
                <a
                  href="https://pflag.org/find-resources"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-blue hover:underline block"
                >
                  Resources Hub
                </a>
              </div>
            </div>

            {/* LGBT National Help Center */}
            <div className="p-5 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-xl font-medium mb-2 text-accent-blue">LGBT National Help Center</h3>
              <p className="text-text-secondary mb-3">In addition to phone hotlines, they offer online peer support for youth, adults, and seniors.</p>
              <a
                href="https://lgbthotline.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-blue hover:underline"
              >
                lgbthotline.org
              </a>
            </div>
          </div>
        </section>

        {/* Important Notice */}
        <section className="mb-10 p-6 bg-accent-pink/10 rounded-xl border border-accent-pink/30">
          <h2 className="text-2xl font-semibold mb-4 text-accent-pink">Important Notice</h2>
          <div className="text-text-secondary space-y-4">
            <p>
              TransFitness does not provide medical care, mental health treatment, or emergency services. The content in this app and on this website is for education and general information only. It is not a substitute for professional diagnosis, medical advice, or treatment.
            </p>
            <p>
              Always talk with a qualified healthcare provider about your hormones, surgeries, medications, injuries, or any changes to your exercise routine. Never ignore or delay seeking professional medical advice because of something you read in this app or on this site.
            </p>
            <p>
              If you are in crisis, thinking about suicide, or at risk of harm, please use the crisis resources above or contact your local emergency services immediately.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

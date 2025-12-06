import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Guidelines - Trans Health & Fitness',
  description: 'Community Guidelines for Trans Health & Fitness app and services',
};

export default function CommunityGuidelines() {
  return (
    <main className="min-h-screen bg-background text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">Community Guidelines</h1>
        <p className="text-accent-blue mb-8">Trans Health &amp; Fitness</p>
        <p className="text-text-tertiary mb-12">Last updated: December 5, 2025</p>

        {/* Introduction */}
        <section className="mb-10">
          <p className="text-text-secondary mb-4">
            Trans Health &amp; Fitness is built to be a safe, supportive space for trans and non-binary athletes. These Community Guidelines outline the behavior we expect from everyone who uses our Services. By using Trans Health &amp; Fitness, you agree to follow these guidelines.
          </p>
        </section>

        {/* Section 1 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">1. Respect and Inclusion</h2>
          <p className="text-text-secondary mb-4">
            Our community is built on mutual respect. We expect all members to:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
            <li>Treat all community members with dignity and respect</li>
            <li>Use correct names and pronouns for other members</li>
            <li>Recognize that everyone&apos;s journey is unique and valid</li>
            <li>Support and encourage fellow athletes regardless of their fitness level, body type, or transition status</li>
            <li>Avoid assumptions about others&apos; identities, experiences, or goals</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">2. Zero Tolerance for Discrimination</h2>
          <p className="text-text-secondary mb-4">
            We do not tolerate discrimination, harassment, or hate speech of any kind. This includes, but is not limited to:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
            <li>Transphobia, homophobia, or any form of LGBTQ+ discrimination</li>
            <li>Racism, sexism, ableism, or discrimination based on body size</li>
            <li>Deadnaming or intentional misgendering</li>
            <li>Slurs, derogatory language, or hate symbols</li>
            <li>Mocking, belittling, or invalidating someone&apos;s identity or experiences</li>
            <li>Outing someone&apos;s trans status or personal information without consent</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">3. Privacy and Confidentiality</h2>
          <p className="text-text-secondary mb-4">
            Privacy is essential to our community&apos;s safety:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
            <li>Never share another member&apos;s personal information, photos, or content without explicit consent</li>
            <li>Do not screenshot or share private conversations</li>
            <li>Respect that many members may not be out in all areas of their lives</li>
            <li>Keep sensitive health and transition-related information confidential</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">4. Health and Safety First</h2>
          <p className="text-text-secondary mb-4">
            Our community prioritizes safe and healthy fitness practices:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
            <li>Do not promote dangerous or extreme dieting, over-exercising, or unhealthy weight loss practices</li>
            <li>Be mindful that discussions about body changes, weight, or appearance can be triggering for some members</li>
            <li>Do not provide medical advice - always encourage others to consult healthcare professionals</li>
            <li>Support members in listening to their bodies and respecting their limits</li>
            <li>Report any content that promotes self-harm or dangerous behaviors</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">5. Constructive Communication</h2>
          <p className="text-text-secondary mb-4">
            When interacting with others in our community:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
            <li>Give feedback that is constructive, supportive, and kind</li>
            <li>Disagree respectfully and avoid personal attacks</li>
            <li>Ask questions with genuine curiosity rather than judgment</li>
            <li>Be patient with members who are new to fitness or the community</li>
            <li>Celebrate others&apos; achievements and progress</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">6. Prohibited Content</h2>
          <p className="text-text-secondary mb-4">
            The following content is not allowed:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
            <li>Spam, scams, or misleading information</li>
            <li>Promotion of illegal substances or activities</li>
            <li>Sexually explicit content or solicitation</li>
            <li>Violence, threats, or content that promotes harm</li>
            <li>Content that infringes on others&apos; intellectual property rights</li>
            <li>Unsolicited promotion of products, services, or other platforms</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">7. Reporting Violations</h2>
          <p className="text-text-secondary mb-4">
            If you experience or witness behavior that violates these guidelines:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
            <li>Report the issue through the app or contact us at taylor@transhealthfitness.com</li>
            <li>Provide as much detail as possible, including screenshots if available</li>
            <li>All reports are taken seriously and handled confidentially</li>
            <li>Do not engage in public confrontations - let our team handle violations</li>
          </ul>
        </section>

        {/* Section 8 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">8. Consequences</h2>
          <p className="text-text-secondary mb-4">
            Violations of these guidelines may result in:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
            <li>A warning from our moderation team</li>
            <li>Temporary suspension of your account</li>
            <li>Permanent removal from the community</li>
            <li>Reporting to relevant authorities if illegal activity is involved</li>
          </ul>
          <p className="text-text-secondary">
            The severity of consequences depends on the nature and frequency of violations. We reserve the right to take immediate action for serious offenses.
          </p>
        </section>

        {/* Section 9 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">9. Our Commitment</h2>
          <p className="text-text-secondary mb-4">
            Trans Health &amp; Fitness is committed to:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
            <li>Maintaining a safe and welcoming environment for all trans and non-binary athletes</li>
            <li>Responding promptly to reports of guideline violations</li>
            <li>Continuously improving our policies based on community feedback</li>
            <li>Being transparent about how we handle violations and appeals</li>
          </ul>
        </section>

        {/* Contact Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
          <p className="text-text-secondary mb-4">
            If you have questions about these Community Guidelines or want to report a concern:
          </p>
          <div className="text-text-secondary">
            <p className="font-medium">Trans Health &amp; Fitness</p>
            <p>Email: taylor@transhealthfitness.com</p>
            <p>Website: transhealthfitness.com</p>
          </div>
        </section>
      </div>
    </main>
  );
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Trans Health & Fitness',
  description: 'Privacy Policy for Trans Health & Fitness app and services',
};

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-background text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-accent-blue mb-8">Trans Health & Fitness</p>
        <p className="text-text-tertiary mb-12">Last updated: December 5, 2024</p>

        {/* Quick Summary */}
        <section className="mb-12 p-6 bg-white/5 rounded-xl border border-white/10">
          <h2 className="text-2xl font-semibold mb-4 text-accent-blue">Quick Summary</h2>
          <p className="text-text-secondary mb-4">
            We know you&apos;re trusting us with very personal information. Here&apos;s the short version:
          </p>
          <ul className="space-y-3 text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-accent-blue mt-1">•</span>
              <span>We collect what we need to run the app: account details, your training profile, and how you use workouts.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-blue mt-1">•</span>
              <span>You can choose how much to share about things like binding, HRT, and surgery stage. We use that to make workouts safer and more relevant.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-blue mt-1">•</span>
              <span><strong>Your data stays on your device by default.</strong> Cloud sync is optional and you control it.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-blue mt-1">•</span>
              <span>We never sell your personal data, and we don&apos;t share it with advertisers.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-blue mt-1">•</span>
              <span>We use minimal analytics—no third-party tracking services.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-blue mt-1">•</span>
              <span>Data is stored with reputable cloud providers and protected with standard security measures like encryption in transit and access controls.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-blue mt-1">•</span>
              <span>You can ask us to delete your account and personal data, subject to any legal requirements.</span>
            </li>
          </ul>
          <p className="text-text-tertiary mt-6 text-sm">
            The more detailed, legal version is below.
          </p>
          <p className="text-text-tertiary mt-2 text-sm italic">
            This policy is general information and is not legal advice. Please have a qualified attorney review it before relying on it.
          </p>
        </section>

        {/* Section 1 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">1. Who We Are</h2>
          <p className="text-text-secondary mb-4">
            Trans Health &amp; Fitness (&quot;Trans Health &amp; Fitness&quot;, &quot;THF&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides a training app and related services designed for trans and non-binary athletes.
          </p>
          <p className="text-text-secondary mb-4">
            This Privacy Policy explains how we collect, use, and share information when you use:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-1">
            <li>Our website at transhealthfitness.com</li>
            <li>Our mobile application</li>
            <li>Any other services that link to this Privacy Policy</li>
          </ul>
          <p className="text-text-secondary mb-4">
            Collectively, we call these the &quot;Services.&quot;
          </p>
          <p className="text-text-secondary">
            By using the Services, you agree to this Privacy Policy. If you do not agree, please do not use the Services.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          <p className="text-text-secondary mb-6">
            We collect information in two main ways: information you give us, and information from third parties.
          </p>

          <h3 className="text-xl font-medium mb-3 text-accent-blue">2.1 Information You Provide</h3>

          <h4 className="text-lg font-medium mb-2 text-text-primary">Account Information</h4>
          <p className="text-text-secondary mb-2">When you create an account or apply for access, you may provide:</p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-1">
            <li>Name or chosen name</li>
            <li>Pronouns</li>
            <li>Email address</li>
            <li>Password or other authentication credentials</li>
          </ul>

          <h4 className="text-lg font-medium mb-2 text-text-primary">Profile and Training Information</h4>
          <p className="text-text-secondary mb-2">
            Because Trans Health &amp; Fitness is built for trans and non-binary athletes, you may choose to share information that some laws consider &quot;sensitive&quot; personal data, including:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-1">
            <li>How you describe your gender or identity</li>
            <li>Whether you use a binder, how often, for how long, and what type</li>
            <li>Whether you are on hormone replacement therapy (HRT), the type (estrogen or testosterone), method of administration (pills, patches, injections, gel), frequency, schedule, and when you started</li>
            <li>General surgery status related to gender-affirming care (for example top surgery, bottom surgery, FFS, orchiectomy), including approximate timing and recovery stage</li>
            <li>Situations that may cause dysphoria (such as mirrors, crowded spaces, certain exercises), and any notes you choose to share about your comfort preferences</li>
            <li>Training experience level and fitness goals</li>
            <li>Equipment you have access to</li>
            <li>Your training environment preference (home, gym, studio, outdoors)</li>
          </ul>

          <h4 className="text-lg font-medium mb-2 text-text-primary">Workout Data</h4>
          <p className="text-text-secondary mb-2">When you use the app, we collect:</p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-1">
            <li>Workouts generated for you and the parameters used to create them</li>
            <li>Workouts you save as favorites, including any notes you add</li>
            <li>Completed workout sessions, including exercises performed, sets, reps, and perceived effort (RPE)</li>
            <li>Exercise modifications or swaps you make</li>
            <li>Pain or discomfort flags you report during workouts</li>
          </ul>

          <h4 className="text-lg font-medium mb-2 text-text-primary">Safety and Personalization Data</h4>
          <p className="text-text-secondary mb-4">
            To keep you safe and provide relevant workouts, we log which safety rules are applied when generating your workouts. This helps us ensure the rules engine is working correctly and allows us to improve our safety protocols over time.
          </p>

          <h4 className="text-lg font-medium mb-2 text-text-primary">Payment Information</h4>
          <p className="text-text-secondary mb-4">
            If we offer paid features in the future, payments will be processed by a third-party provider. That provider would collect your payment card number and billing details. We would receive confirmation of your payment and limited billing information (for example the last four digits of your card and subscription status), but we would not store your full card number on our servers.
          </p>

          <h4 className="text-lg font-medium mb-2 text-text-primary">Support and Communication</h4>
          <p className="text-text-secondary mb-2">If you contact us by email or through in-app forms, we collect:</p>
          <ul className="list-disc list-inside text-text-secondary mb-6 space-y-1">
            <li>Your contact details</li>
            <li>The content of your messages and any attachments you choose to send</li>
            <li>Metadata such as the date and time of the communication</li>
          </ul>

          <h3 className="text-xl font-medium mb-3 text-accent-blue">2.2 Information from Third Parties</h3>
          <p className="text-text-secondary mb-2">We may receive limited information about you from:</p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-1">
            <li><strong>Payment processors</strong> (if applicable), which would send us payment confirmations, subscription status, and limited billing details</li>
          </ul>
          <p className="text-text-secondary">
            We treat this information according to this Privacy Policy.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p className="text-text-secondary mb-4">We use your information for these purposes:</p>

          <h3 className="text-xl font-medium mb-3 text-accent-blue">3.1 To Provide and Personalize the Services</h3>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-1">
            <li>Create and manage your user account</li>
            <li>Generate workout programs tailored to your profile, preferences, and goals</li>
            <li>Apply safety rules based on the information you voluntarily share about binding, HRT, surgery stages, and dysphoria triggers</li>
            <li>Remember your settings, such as pronouns and equipment</li>
            <li>Save and sync your favorite workouts</li>
          </ul>

          <h3 className="text-xl font-medium mb-3 text-accent-blue">3.2 To Support Safety and Quality</h3>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-1">
            <li>Log which safety rules are applied to your workouts to ensure our safety engine is working correctly</li>
            <li>Monitor for patterns that suggest bugs, misuse, or potential safety issues</li>
            <li>Develop new features that better respect trans and non-binary experiences</li>
            <li>Collect equipment requests (when you tell us about equipment we don&apos;t yet support) to improve our exercise library</li>
          </ul>

          <h3 className="text-xl font-medium mb-3 text-accent-blue">3.3 To Communicate with You</h3>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-1">
            <li>Send service-related messages, for example account confirmations, security alerts, and important updates</li>
            <li>Respond to your questions, requests, and feedback</li>
            <li>With your consent where required, send optional product updates and beta invitations</li>
          </ul>

          <h3 className="text-xl font-medium mb-3 text-accent-blue">3.4 To Operate, Secure, and Improve the Services</h3>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-1">
            <li>Understand how people use the app so we can make it more reliable and accessible</li>
            <li>Debug and fix errors, improve performance, and test new designs</li>
            <li>Prevent, detect, and investigate fraud or abuse</li>
          </ul>

          <h3 className="text-xl font-medium mb-3 text-accent-blue">3.5 To Comply with Legal Obligations</h3>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-1">
            <li>Keep appropriate records</li>
            <li>Respond to lawful requests from public authorities where we are legally required to do so</li>
          </ul>

          <p className="text-text-secondary font-medium">
            We do not use your sensitive personal information for targeted advertising, and we do not sell your personal data.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">4. Legal Bases for Processing (EEA and UK Users)</h2>
          <p className="text-text-secondary mb-4">
            If you are in the European Economic Area or the United Kingdom, we process your personal data under these legal bases:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-1">
            <li><strong>Contract</strong> – to provide the Services you sign up for, including account management and personalized workouts</li>
            <li><strong>Consent</strong> – especially for processing sensitive information such as gender identity and health-related data, and for certain communications</li>
            <li><strong>Legitimate interests</strong> – such as improving the Services, ensuring security, and preventing abuse, where these interests are not overridden by your rights and freedoms</li>
            <li><strong>Legal obligations</strong> – when we need to comply with applicable laws and regulations</li>
          </ul>
          <p className="text-text-secondary">
            You can withdraw your consent at any time, though this may limit some features.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">5. How We Handle Sensitive Information</h2>
          <p className="text-text-secondary mb-4">
            Information about your gender identity, HRT status, binder use, surgery stages, dysphoria triggers, and related health details may be considered sensitive or &quot;special category&quot; data.
          </p>
          <p className="text-text-secondary mb-2">We:</p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-1">
            <li>Collect this information only when you voluntarily provide it</li>
            <li>Use it primarily to personalize workouts, apply safety rules, and improve relevance</li>
            <li>Restrict internal access to this information to people who need it to do their work</li>
            <li>Do not use this information for targeted advertising</li>
            <li>Do not sell this information to third parties</li>
          </ul>
          <p className="text-text-secondary mb-4">
            You can skip or remove some of this information in settings, though that may limit personalization and safety adjustments.
          </p>
          <p className="text-text-secondary font-medium">
            Trans Health &amp; Fitness is not a medical provider and is not a covered entity under HIPAA. We treat your data with care, but the Services are not a substitute for medical care or a medical records system.
          </p>
        </section>

        {/* Section 6 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">6. Local-First Data Storage</h2>
          <p className="text-text-secondary mb-4">
            <strong>Your data stays on your device by default.</strong> We designed the app with a local-first architecture, meaning:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-1">
            <li>Your profile, workout history, and session data are stored locally on your device</li>
            <li>Cloud sync is optional—you control whether your data is backed up to our servers</li>
            <li>If you enable cloud sync, your data is encrypted in transit and stored securely with our cloud provider (Supabase)</li>
            <li>You can use the app without enabling cloud sync</li>
          </ul>
          <p className="text-text-secondary">
            This means even if you never enable cloud sync, the app will work fully and your sensitive health information never leaves your device.
          </p>
        </section>

        {/* Section 7 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">7. How We Share Your Information</h2>
          <p className="text-text-secondary mb-4">We share your information in limited situations:</p>

          <h3 className="text-xl font-medium mb-3 text-accent-blue">7.1 Service Providers</h3>
          <p className="text-text-secondary mb-2">
            We work with trusted third-party providers who help us run and improve the Services, including:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-1">
            <li><strong>Supabase</strong> – Cloud hosting, database, and authentication services</li>
            <li>Email providers for account-related communications</li>
          </ul>
          <p className="text-text-secondary mb-4">
            They may only use your information to perform services on our behalf and must protect it appropriately.
          </p>

          <h3 className="text-xl font-medium mb-3 text-accent-blue">7.2 Payment Processors</h3>
          <p className="text-text-secondary mb-4">
            If we offer paid features in the future, your payment would be handled by a third-party payment processor. They would store and process your payment card details. We would receive payment confirmation and limited billing data, but not your full card number.
          </p>

          <h3 className="text-xl font-medium mb-3 text-accent-blue">7.3 Aggregated or De-identified Data</h3>
          <p className="text-text-secondary mb-4">
            We may use and share data that has been aggregated or de-identified so it cannot reasonably be used to identify you. For example, statistics such as the number of workouts completed or the percentage of users who train while binding.
          </p>
          <p className="text-text-secondary mb-4 font-medium">
            We do not sell your personal data.
          </p>

          <h3 className="text-xl font-medium mb-3 text-accent-blue">7.4 Legal and Safety</h3>
          <p className="text-text-secondary mb-2">
            We may disclose information if we believe in good faith that it is reasonably necessary to:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-1">
            <li>Comply with applicable law, regulation, legal process, or government request</li>
            <li>Enforce our terms of use or other agreements</li>
            <li>Protect the rights, property, or safety of Trans Health &amp; Fitness, our users, or others</li>
          </ul>

          <h3 className="text-xl font-medium mb-3 text-accent-blue">7.5 Business Transfers</h3>
          <p className="text-text-secondary">
            If we are involved in a merger, acquisition, financing, or sale of all or part of our business, your information may be transferred as part of that transaction, subject to commitments consistent with this Privacy Policy.
          </p>
        </section>

        {/* Section 8 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">8. Cookies and Similar Technologies</h2>
          <p className="text-text-secondary mb-4">
            <strong>On our website</strong>, we may use cookies and similar technologies to:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-1">
            <li>Remember your preferences</li>
            <li>Keep you signed in</li>
            <li>Measure traffic and usage patterns</li>
          </ul>
          <p className="text-text-secondary mb-4">
            You can control cookies through your browser settings. Some features may not work properly if you disable cookies.
          </p>
          <p className="text-text-secondary">
            <strong>The mobile app does not use cookies.</strong> Authentication and preferences are handled through secure local storage.
          </p>
        </section>

        {/* Section 9 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">9. Data Security</h2>
          <p className="text-text-secondary mb-2">
            We take reasonable technical and organizational measures to protect your personal information, including:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-1">
            <li>Using reputable cloud and database providers (Supabase) with encryption in transit (HTTPS/TLS) and encryption at rest</li>
            <li>Storing authentication tokens in your device&apos;s secure storage (hardware-backed where available)</li>
            <li>Limiting access to personal data to people who need it to do their job</li>
            <li>Using authentication and access controls (Row Level Security) to protect data</li>
            <li>Requiring email verification for new accounts</li>
          </ul>
          <p className="text-text-secondary mb-4">
            However, no method of transmission or storage is completely secure. We cannot guarantee absolute security.
          </p>
          <p className="text-text-secondary">
            You are responsible for keeping your account credentials confidential and for promptly notifying us if you believe your account has been compromised.
          </p>
        </section>

        {/* Section 10 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">10. Data Retention</h2>
          <p className="text-text-secondary mb-4">
            We keep personal information for as long as reasonably necessary to provide the Services, operate our business, and comply with legal obligations.
          </p>
          <p className="text-text-secondary mb-2">In general:</p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-1">
            <li>Account and profile data are retained while your account is active</li>
            <li>Workout history and session data are retained while your account exists, unless you request deletion</li>
            <li>Local data on your device remains until you delete the app or clear its data</li>
          </ul>
          <p className="text-text-secondary">
            When we no longer need personal information, we will delete or anonymize it, or, if that is not possible, we will securely store it and isolate it from further use until deletion is possible.
          </p>
        </section>

        {/* Section 11 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">11. Your Rights and Choices</h2>
          <p className="text-text-secondary mb-4">
            Depending on where you live, you may have rights regarding your personal information.
          </p>

          <h3 className="text-xl font-medium mb-3 text-accent-blue">11.1 Access, Correction, and Deletion</h3>
          <p className="text-text-secondary mb-2">You may have the right to:</p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-1">
            <li>Access the personal information we hold about you</li>
            <li>Correct inaccurate or incomplete information</li>
            <li>Request deletion of your personal information</li>
          </ul>
          <p className="text-text-secondary mb-4">
            You can often do this in the app via account settings. You can also contact us at taylor@transhealthfitness.com.
          </p>
          <p className="text-text-secondary mb-4">
            We may need to verify your identity before responding, and we may retain certain information where required by law or legitimate business needs.
          </p>

          <h3 className="text-xl font-medium mb-3 text-accent-blue">11.2 Opting Out of Communications</h3>
          <p className="text-text-secondary mb-4">
            You can opt out of non-essential emails (like newsletters or announcements) by using the unsubscribe link in those messages or contacting us. We may still send service-related messages, such as security alerts.
          </p>

          <h3 className="text-xl font-medium mb-3 text-accent-blue">11.3 Additional Rights (EEA, UK, and Other Regions)</h3>
          <p className="text-text-secondary mb-2">
            If you are in the EEA, UK, California, or other regions with specific privacy laws, you may have additional rights, such as:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-1">
            <li>The right to object to certain processing</li>
            <li>The right to restrict processing in some circumstances</li>
            <li>The right to data portability</li>
          </ul>
          <p className="text-text-secondary">
            You can exercise these rights by contacting us at taylor@transhealthfitness.com. We will respond as required by applicable law.
          </p>
        </section>

        {/* Section 12 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">12. Children&apos;s Privacy</h2>
          <p className="text-text-secondary">
            Trans Health &amp; Fitness is not intended for children under 16, and we do not knowingly collect personal information from children under 16. If you believe a child has provided us with personal information without appropriate consent, please contact us so we can delete it.
          </p>
        </section>

        {/* Section 13 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">13. International Data Transfers</h2>
          <p className="text-text-secondary mb-4">
            We are based in the United States, and your information may be stored or processed there or in other countries where our service providers operate. These locations may have privacy laws that differ from those in your jurisdiction.
          </p>
          <p className="text-text-secondary">
            Where required, we use appropriate safeguards (such as standard contractual clauses or similar mechanisms) to protect personal data transferred internationally.
          </p>
        </section>

        {/* Section 14 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">14. Changes to This Privacy Policy</h2>
          <p className="text-text-secondary mb-4">
            We may update this Privacy Policy from time to time. When we do, we will update the &quot;Last updated&quot; date at the top of this page. In some cases, we may provide additional notice (for example in-app or by email).
          </p>
          <p className="text-text-secondary">
            Your continued use of the Services after a revised Privacy Policy becomes effective means you accept the changes.
          </p>
        </section>

        {/* Section 15 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">15. Contact Us</h2>
          <p className="text-text-secondary mb-4">
            If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information, you can contact us at:
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

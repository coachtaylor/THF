import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Trans Health & Fitness',
  description: 'Terms of Service for Trans Health & Fitness app and services',
};

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-background text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-accent-blue mb-8">Trans Health &amp; Fitness</p>
        <p className="text-text-tertiary mb-12">Last updated: December 5, 2025</p>

        {/* Introduction */}
        <section className="mb-10">
          <p className="text-text-secondary mb-4">
            These Terms of Service (the &quot;Terms&quot;) govern your access to and use of the website, mobile application, and related services provided by Trans Health &amp; Fitness (&quot;Trans Health &amp; Fitness&quot;, &quot;THF&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), including any content, features, and programs (collectively, the &quot;Services&quot;).
          </p>
          <p className="text-text-secondary mb-4">
            By creating an account, accessing, or using the Services, you agree to be bound by these Terms. If you do not agree, you may not use the Services.
          </p>
          <p className="text-text-tertiary text-sm italic">
            This document is a general template and does not constitute legal advice. You should have a qualified attorney review and adapt it for your specific situation and jurisdiction.
          </p>
        </section>

        {/* Section 1 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">1. Who We Are</h2>
          <p className="text-text-secondary mb-4">
            Trans Health &amp; Fitness provides a fitness application and related tools designed primarily for trans and non-binary athletes. The Services generate workouts and training guidance that take into account information you choose to share, such as binder use, HRT status, surgery stage, equipment, and goals. The Services are intended for informational and educational purposes related to general fitness.
          </p>
          <p className="text-text-secondary font-medium">
            Trans Health &amp; Fitness is not a medical provider and does not offer medical care, diagnosis, or treatment.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">2. Eligibility</h2>
          <p className="text-text-secondary mb-4">To use the Services, you must:</p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
            <li>Be at least sixteen (16) years old, or the minimum age of digital consent in your jurisdiction, whichever is higher</li>
            <li>Have the legal power to enter into a binding contract with us</li>
            <li>Not be barred from using the Services under any applicable laws</li>
          </ul>
          <p className="text-text-secondary mb-4">
            If you use the Services on behalf of another person, or on behalf of an organization, you represent that you are authorized to accept these Terms on their behalf and that they agree to be bound by these Terms.
          </p>
          <p className="text-text-secondary">
            The Services are not directed to children under sixteen and we do not knowingly collect personal information from children under that age.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">3. Account Registration and Security</h2>
          <p className="text-text-secondary mb-4">
            You may need to create an account to access some or all of the Services.
          </p>
          <p className="text-text-secondary mb-4">When you create an account, you agree to:</p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
            <li>Provide accurate and complete information, for example your email and chosen name</li>
            <li>Maintain and promptly update your information if it changes</li>
            <li>Keep your login credentials confidential and not share them with others</li>
            <li>Notify us immediately at taylor@transhealthfitness.com if you suspect any unauthorized access to your account</li>
          </ul>
          <p className="text-text-secondary mb-4">
            You are responsible for all activities that occur under your account, whether or not you authorized them. We are not liable for any loss or damage arising from your failure to protect your account credentials.
          </p>
          <p className="text-text-secondary">
            We reserve the right to suspend or terminate your account if we believe you have violated these Terms or are using the Services in a way that may harm others or Trans Health &amp; Fitness.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">4. Description of the Services</h2>
          <p className="text-text-secondary mb-4">The Services may include, among other things:</p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
            <li>Onboarding flows that ask for information such as identity, binder use, HRT status, surgery stage, training experience, and goals</li>
            <li>Generated workout programs, individual exercises, and training suggestions</li>
            <li>Features that allow you to give feedback, for example &quot;too easy&quot;, &quot;too hard&quot;, &quot;felt gender affirming&quot;, or &quot;felt dysphoria triggering&quot;</li>
            <li>Educational content related to training, recovery, and trans-inclusive fitness concepts</li>
            <li>Account and subscription management features</li>
          </ul>
          <p className="text-text-secondary mb-4">
            We may offer some parts of the Services for free, and others only through paid subscriptions or special programs such as a &quot;Founding Athlete&quot; plan or beta access.
          </p>
          <p className="text-text-secondary">
            Because the Services are actively being developed and improved, features may change, be added, or be removed over time.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">5. Health and Safety, Not Medical Advice</h2>
          <p className="text-text-secondary mb-4">
            Trans Health &amp; Fitness is designed to support general fitness and training, not to provide medical care.
          </p>
          <p className="text-text-secondary mb-4">By using the Services, you acknowledge and agree that:</p>

          <h3 className="text-xl font-medium mb-3 text-accent-blue">No Medical Advice</h3>
          <p className="text-text-secondary mb-4">
            The Services do not provide medical advice, diagnosis, or treatment. Nothing in the app, website, or communications from us should be interpreted as medical advice or a substitute for consultation with a physician, surgeon, endocrinologist, therapist, or other qualified health professional.
          </p>

          <h3 className="text-xl font-medium mb-3 text-accent-blue">Consult Your Health Care Team</h3>
          <p className="text-text-secondary mb-4">
            You are solely responsible for seeking medical advice before beginning, changing, or stopping any exercise program, especially if you are on HRT, recovering from surgery, experiencing pain, or have any medical condition or concern. You should follow the instructions of your medical providers if they conflict with any information from the Services.
          </p>

          <h3 className="text-xl font-medium mb-3 text-accent-blue">Listen to Your Body and Environment</h3>
          <p className="text-text-secondary mb-4">
            Physical activity involves risk. Injuries can occur even when a program is well designed. You are responsible for using appropriate equipment, warming up, choosing safe training environments, and stopping if you feel pain, dizziness, chest discomfort, trouble breathing, or any symptom that concerns you.
          </p>

          <h3 className="text-xl font-medium mb-3 text-accent-blue">No Guarantee of Results</h3>
          <p className="text-text-secondary mb-4">
            We do not guarantee any particular fitness, health, body composition, or performance results. Outcomes depend on many factors beyond our control, including your health status, consistency, environment, and adherence.
          </p>

          <p className="text-text-secondary mb-4">
            To the fullest extent permitted by law, Trans Health &amp; Fitness is not responsible for any injury, health issue, or other damage that may result from your use of the Services or your participation in activities suggested by the Services.
          </p>
          <p className="text-text-secondary font-medium">
            If you believe you are experiencing a medical emergency, contact your local emergency services immediately. Do not rely on the Services for emergency help.
          </p>
        </section>

        {/* Section 6 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">6. Subscriptions, Trials, and Payments</h2>

          <h3 className="text-xl font-medium mb-3 text-accent-blue">6.1 Subscriptions</h3>
          <p className="text-text-secondary mb-4">
            We may offer subscription plans, such as a monthly or annual plan, including special plans like a &quot;Founding Athlete&quot; plan. When you subscribe:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
            <li>You authorize us and our payment processors to charge you the subscription fee and any applicable taxes using your chosen payment method.</li>
            <li>Your subscription will automatically renew at the end of each billing period, unless you cancel before the renewal date.</li>
          </ul>
          <p className="text-text-secondary mb-4">
            Prices, plan features, and availability may change over time. If we change the price of your plan, we will give you notice in line with applicable law, and the new price will apply on your next billing period unless you cancel.
          </p>

          <h3 className="text-xl font-medium mb-3 text-accent-blue">6.2 Free Trials and Promotions</h3>
          <p className="text-text-secondary mb-4">
            We may offer free trials, discounts, or promotional pricing. Additional terms may apply to these offers, and we reserve the right to modify or withdraw them at any time.
          </p>
          <p className="text-text-secondary mb-4">
            If your subscription includes a free trial, we will begin billing you at the end of the trial period unless you cancel before the trial ends.
          </p>

          <h3 className="text-xl font-medium mb-3 text-accent-blue">6.3 Billing and Refunds</h3>
          <p className="text-text-secondary mb-4">Unless otherwise stated:</p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
            <li>All fees are stated and charged in USD.</li>
            <li>Fees are non-refundable except where required by applicable law or explicitly stated otherwise.</li>
          </ul>
          <p className="text-text-secondary mb-4">
            You can cancel your subscription at any time, following the instructions in the app, on our website, or through the app store where you purchased the subscription. When you cancel, you will generally retain access to the subscribed features until the end of your current billing period, and you will not be charged again, but you will not receive a refund for fees already paid, unless required by law.
          </p>
          <p className="text-text-secondary">
            If a payment fails or your subscription lapses, we may suspend or downgrade your access to paid features.
          </p>
        </section>

        {/* Section 7 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">7. Beta Programs and Early Access</h2>
          <p className="text-text-secondary mb-4">
            From time to time, we may offer access to beta, preview, or early access versions of the Services, including special programs such as a &quot;Founding Athlete&quot; beta.
          </p>
          <p className="text-text-secondary mb-4">
            By participating in any beta or early access program, you understand and agree that:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
            <li>These versions may be less stable than released versions and may contain bugs or incomplete features.</li>
            <li>Features, data structures, and content may change, break, or be removed without notice.</li>
            <li>We may collect additional feedback, usage data, or research responses to improve the Services.</li>
            <li>We may limit or end beta access at any time, for any reason, without liability to you.</li>
          </ul>
          <p className="text-text-secondary">
            You should not rely on beta or early access versions of the Services for critical training decisions. Participation in these programs does not give you any ownership interest in Trans Health &amp; Fitness or its intellectual property.
          </p>
        </section>

        {/* Section 8 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">8. Acceptable Use</h2>
          <p className="text-text-secondary mb-4">
            You agree to use the Services only in a lawful manner and in accordance with these Terms. You will not:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
            <li>Use the Services for any purpose that is illegal, harmful, discriminatory, or harassing, including harassment of trans, non-binary, or other marginalized users</li>
            <li>Attempt to gain unauthorized access to the Services, accounts, or systems</li>
            <li>Interfere with or disrupt the operation of the Services, for example by introducing malware or performing denial-of-service attacks</li>
            <li>Reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code, underlying ideas, or algorithms of the Services, except as permitted by applicable law</li>
            <li>Use any automated system, such as bots or scrapers, to access the Services in a way that may burden or disrupt them</li>
            <li>Reproduce, distribute, modify, sell, resell, or exploit any part of the Services in a way that is not expressly allowed by these Terms</li>
            <li>Use the Services to build or support a competing product or service that directly imitates or substantially copies the core functionality, design, or safety logic of Trans Health &amp; Fitness</li>
            <li>Submit content that is unlawful, defamatory, threatening, hateful, or infringes another person&apos;s rights</li>
          </ul>
          <p className="text-text-secondary">
            We may investigate and take appropriate action, including removing content, limiting features, or terminating accounts, if we believe you have violated this section.
          </p>
        </section>

        {/* Section 9 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">9. Intellectual Property</h2>
          <p className="text-text-secondary mb-4">
            The Services, including all software, code, algorithms, design, text, images, graphics, logos, trademarks, and other content, are owned by or licensed to Trans Health &amp; Fitness and are protected by copyright, trademark, and other laws.
          </p>
          <p className="text-text-secondary mb-4">
            Except as explicitly stated in these Terms, we do not grant you any rights in or to the Services or any content. All rights not expressly granted are reserved by Trans Health &amp; Fitness and its licensors.
          </p>
          <p className="text-text-secondary">
            You may not remove, alter, or obscure any copyright, trademark, or other proprietary notices on or in the Services.
          </p>
        </section>

        {/* Section 10 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">10. License to Use the Services</h2>
          <p className="text-text-secondary mb-4">
            Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
            <li>Install and use the Trans Health &amp; Fitness mobile application on a device that you own or control, and</li>
            <li>Access and use the Services for your personal, non-commercial fitness and wellness purposes.</li>
          </ul>
          <p className="text-text-secondary mb-4">You may not:</p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
            <li>Copy, modify, or create derivative works based on the Services, except as expressly permitted by these Terms or applicable law</li>
            <li>Rent, lease, lend, sell, sublicense, or otherwise transfer the Services to another person</li>
            <li>Circumvent or attempt to circumvent any technical limitations or security measures in the Services</li>
          </ul>
          <p className="text-text-secondary">
            We may revoke this license at any time if you violate these Terms or use the Services in a way that we believe may harm us or others.
          </p>
        </section>

        {/* Section 11 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">11. User Content and Feedback</h2>

          <h3 className="text-xl font-medium mb-3 text-accent-blue">11.1 User Content</h3>
          <p className="text-text-secondary mb-4">
            The Services may allow you to submit, upload, or provide content, for example:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
            <li>Feedback on workouts, including written comments</li>
            <li>Responses to surveys or research questions</li>
            <li>Suggestions, questions, or other messages sent through support channels</li>
          </ul>
          <p className="text-text-secondary mb-4">
            You retain ownership of any content you submit, subject to the rights you grant below.
          </p>
          <p className="text-text-secondary mb-4">
            You are responsible for the content you provide and for ensuring that it does not violate the law or the rights of others.
          </p>

          <h3 className="text-xl font-medium mb-3 text-accent-blue">11.2 License to Trans Health &amp; Fitness</h3>
          <p className="text-text-secondary mb-4">
            By submitting content to the Services, you grant Trans Health &amp; Fitness a worldwide, non-exclusive, royalty-free, transferable, and sublicensable license to:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
            <li>Use, reproduce, modify, adapt, translate, distribute, and display the content in connection with operating, improving, and promoting the Services, and</li>
            <li>Create aggregated or de-identified data from the content for research, analytics, and development purposes.</li>
          </ul>
          <p className="text-text-secondary mb-4">
            Where possible, we will use content in an aggregated or de-identified way so that it does not identify you personally.
          </p>

          <h3 className="text-xl font-medium mb-3 text-accent-blue">11.3 Feedback</h3>
          <p className="text-text-secondary mb-4">
            If you provide suggestions, ideas, or other feedback about the Services (&quot;Feedback&quot;), you agree that:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
            <li>We may use the Feedback without restriction or obligation to you, including to develop and improve the Services or new products.</li>
            <li>You are not entitled to any compensation or credit for the Feedback.</li>
          </ul>
        </section>

        {/* Section 12 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">12. Third-Party Services and Links</h2>
          <p className="text-text-secondary mb-4">
            The Services may contain links to third-party websites, content, or services, such as educational resources, research articles, or app store platforms.
          </p>
          <p className="text-text-secondary mb-4">
            Trans Health &amp; Fitness does not control and is not responsible for:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
            <li>The content or practices of third-party sites or services, or</li>
            <li>Any products or services offered by third parties.</li>
          </ul>
          <p className="text-text-secondary">
            Your use of third-party sites and services is at your own risk and subject to their own terms and privacy policies.
          </p>
        </section>

        {/* Section 13 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">13. Disclaimers</h2>
          <p className="text-text-secondary mb-4">
            To the fullest extent permitted by law, the Services and all content are provided &quot;as is&quot; and &quot;as available,&quot; without warranties of any kind, whether express, implied, or statutory.
          </p>
          <p className="text-text-secondary mb-4">
            Without limiting the foregoing, we do not make any warranty that:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
            <li>The Services will be uninterrupted, secure, or error-free</li>
            <li>Any defects will be corrected</li>
            <li>The information provided through the Services is accurate, complete, or up to date</li>
            <li>The Services will meet your expectations, health goals, or performance goals</li>
          </ul>
          <p className="text-text-secondary mb-4">
            We specifically disclaim all warranties of merchantability, fitness for a particular purpose, non-infringement, and any warranties arising out of course of dealing or usage of trade.
          </p>
          <p className="text-text-secondary mb-4">
            You use the Services, and engage in any fitness activities suggested by the Services, entirely at your own risk.
          </p>
          <p className="text-text-secondary">
            Some jurisdictions do not allow certain disclaimers, so some of the above may not apply to you.
          </p>
        </section>

        {/* Section 14 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">14. Limitation of Liability</h2>
          <p className="text-text-secondary mb-4">To the fullest extent permitted by law:</p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
            <li>Trans Health &amp; Fitness, its affiliates, and their respective directors, officers, employees, and agents will not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, arising out of or relating to your use of or inability to use the Services.</li>
            <li>Our total liability for all claims arising out of or relating to the Services or these Terms will not exceed the greater of (a) the amount you have paid to us for the Services in the twelve (12) months preceding the event that gave rise to the claim, or (b) fifty US dollars (USD 50), or the equivalent in your local currency.</li>
          </ul>
          <p className="text-text-secondary mb-4">
            These limitations apply whether the claims are based on warranty, contract, tort, negligence, strict liability, or any other legal theory, even if we have been advised of the possibility of such damages.
          </p>
          <p className="text-text-secondary">
            Some jurisdictions do not allow the exclusion or limitation of certain damages, so some of the above limitations may not apply to you.
          </p>
        </section>

        {/* Section 15 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">15. Indemnification</h2>
          <p className="text-text-secondary mb-4">
            To the extent permitted by law, you agree to indemnify, defend, and hold harmless Trans Health &amp; Fitness, its affiliates, and their respective directors, officers, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorney&apos;s fees, arising out of or in any way connected with:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
            <li>Your access to or use of the Services</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any rights of another person, including privacy or intellectual property rights</li>
            <li>Any content you submit or provide through the Services</li>
          </ul>
          <p className="text-text-secondary">
            We reserve the right to take exclusive control of the defense of any matter subject to indemnification, and you agree to cooperate with our defense.
          </p>
        </section>

        {/* Section 16 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">16. Termination</h2>
          <p className="text-text-secondary mb-4">
            You may stop using the Services and close your account at any time by following the instructions in the app or contacting us at taylor@transhealthfitness.com.
          </p>
          <p className="text-text-secondary mb-4">
            We may suspend or terminate your access to the Services, at our discretion, if:
          </p>
          <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
            <li>You violate these Terms or applicable law</li>
            <li>We believe your use of the Services may harm us, other users, or third parties</li>
            <li>We decide to discontinue the Services, in whole or in part</li>
          </ul>
          <p className="text-text-secondary mb-4">
            If we terminate your access without cause, and you have a paid subscription, we may provide a pro-rated refund for any unused portion of your current billing period, where required by law.
          </p>
          <p className="text-text-secondary">
            Sections that by their nature should survive termination, including but not limited to sections on intellectual property, user content, disclaimers, limitation of liability, indemnification, and dispute resolution, will continue in effect after your access to the Services ends.
          </p>
        </section>

        {/* Section 17 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">17. Governing Law and Dispute Resolution</h2>
          <p className="text-text-secondary mb-4">
            The interpretation of these Terms and any dispute arising from or relating to the Services will be governed by the laws of the State of California, without regard to its conflict of laws rules.
          </p>
          <p className="text-text-secondary mb-4">
            You and Trans Health &amp; Fitness agree to attempt to resolve any dispute informally first, by contacting taylor@transhealthfitness.com and allowing a reasonable time for a response.
          </p>
          <p className="text-text-secondary mb-4">
            You and Trans Health &amp; Fitness may agree in a separate written agreement to submit disputes to binding arbitration or another form of alternative dispute resolution. If no such agreement is in place, disputes may be brought in the courts located in the State of California, and you consent to the jurisdiction of those courts.
          </p>
          <p className="text-text-secondary">
            Nothing in this section limits any rights you may have under mandatory consumer protection laws in your country of residence.
          </p>
        </section>

        {/* Section 18 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">18. Changes to the Services and These Terms</h2>
          <p className="text-text-secondary mb-4">
            We are always working to improve Trans Health &amp; Fitness, so the Services may change over time. We may add, modify, or remove features or content, and we may suspend or discontinue parts of the Services.
          </p>
          <p className="text-text-secondary mb-4">
            We may also update these Terms from time to time. When we do, we will update the &quot;Last updated&quot; date at the top of this page. In some cases, we may provide additional notice, for example in the app or by email.
          </p>
          <p className="text-text-secondary">
            If you continue to use the Services after the updated Terms become effective, you agree to be bound by the updated Terms. If you do not agree, you must stop using the Services.
          </p>
        </section>

        {/* Section 19 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">19. Contact Information</h2>
          <p className="text-text-secondary mb-4">
            If you have any questions about these Terms or the Services, you can contact us at:
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

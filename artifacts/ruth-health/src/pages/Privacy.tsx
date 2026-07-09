export default function Privacy() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
      <h1 className="text-4xl md:text-5xl font-serif mb-8">Privacy Policy</h1>
      
      <div className="prose prose-lg prose-neutral max-w-none text-muted-foreground">
        <p className="text-foreground font-medium">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        
        <p>
          At Ruth Health, we take your privacy seriously. This Privacy Policy outlines how we collect, use, disclose, and safeguard your personal information in accordance with applicable Nigerian privacy laws and regulations.
        </p>

        <h2 className="text-foreground font-serif">1. Information We Collect</h2>
        <p>
          We collect information that you provide directly to us when you:
        </p>
        <ul>
          <li>Have a member account created by an administrator</li>
          <li>Book a consultation with our wellness professionals</li>
          <li>Purchase health products or devices</li>
          <li>Enroll in our educational courses</li>
        </ul>

        <h2 className="text-foreground font-serif">2. Use of Information</h2>
        <p>
          The information we collect is used to:
        </p>
        <ul>
          <li>Provide, maintain, and improve our services</li>
          <li>Process transactions and send related information</li>
          <li>Send technical notices, updates, security alerts, and support messages</li>
          <li>Respond to your comments, questions, and requests</li>
          <li>Manage referral tracking and commission payouts</li>
        </ul>

        <h2 className="text-foreground font-serif">3. Consultations</h2>
        <p>
          All virtual consultations are conducted through secure, encrypted channels. We maintain the confidentiality of all consultation records in compliance with industry wellness standards and applicable privacy legislation.
        </p>

        <h2 className="text-foreground font-serif">4. Cookies and Tracking</h2>
        <p>
          We use cookies and similar tracking technologies to track activity on our platform and hold certain information, such as referral codes, to ensure accurate commission crediting.
        </p>

        <h2 className="text-foreground font-serif">5. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy or our data practices, please contact our Privacy Officer at privacy@ruthhealth.com.
        </p>
      </div>
    </div>
  );
}

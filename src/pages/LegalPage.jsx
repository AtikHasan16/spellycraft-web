import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router";
import MinimalFooter from "../components/MinimalFooter";
import PublicNavbar from "../components/PublicNavbar";

const effectiveDate = "November 19, 2026";

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold text-body-dark">{title}</h2>
      <div className="space-y-2 text-sm leading-6 text-muted-label">{children}</div>
    </section>
  );
}

function TermsOfService() {
  return (
    <>
      <h1 className="text-3xl font-black tracking-tight text-body-dark sm:text-4xl">
        Terms of Service
      </h1>
      <p className="text-sm text-muted-label">Effective {effectiveDate}</p>
      <p>
        SpellyCraft provides English vocabulary, spelling, grammar, and study tools,
        including optional AI-assisted features. By using the site, you agree to these
        terms. If you do not agree, please do not use the service.
      </p>
      <Section title="Using SpellyCraft">
        <p>
          Use the service lawfully and do not disrupt it, probe accounts or systems
          without permission, submit harmful content, or try to access another
          person’s data. You are responsible for keeping your sign-in details safe and
          for activity through your account.
        </p>
      </Section>
      <Section title="Learning content and AI">
        <p>
          Study materials are for learning support. AI-generated explanations and
          translations can be incomplete or wrong; review them before relying on them.
          SpellyCraft is independent and is not affiliated with or endorsed by IELTS.
          We do not promise a particular exam result.
        </p>
      </Section>
      <Section title="Your content and account">
        <p>
          You keep rights to material you provide. You allow us and the services we use
          to process it only as needed to operate the features you request. Do not
          upload material you do not have permission to use. Contact us to request
          account or data deletion; some records may need to remain where required for
          security, legal, or operational reasons.
        </p>
      </Section>
      <Section title="Availability and changes">
        <p>
          We currently offer the service without charge, but features and availability
          may change. We work to keep the site available and accurate, but cannot
          promise uninterrupted service or that every feature will always be error-free.
          We may update these terms; continued use after an update means you accept the
          revised terms.
        </p>
      </Section>
      <Section title="Contact">
        <p>
          Questions about these terms? Email{" "}
          <a className="text-plum underline" href="mailto:info@spellycraft.com">
            info@spellycraft.com
          </a>
          .
        </p>
      </Section>
    </>
  );
}

function PrivacyPolicy() {
  return (
    <>
      <h1 className="text-3xl font-black tracking-tight text-body-dark sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="text-sm text-muted-label">Effective {effectiveDate}</p>
      <p>
        This policy explains what SpellyCraft handles when you visit or use the site,
        why we use it, and the choices available to you.
      </p>
      <Section title="Information we handle">
        <p>
          Account information may include your email, name, profile photo URL, sign-in
          provider, and account timestamps. Supabase Auth handles passwords and
          authentication. When signed in, we store profile details and your saved
          vocabulary, spelling, flashcard, grammar, and study progress. If you contact
          us or apply to volunteer, we receive the details and message you submit.
        </p>
        <p>
          The site uses browser storage for your sign-in session, a profile cache, and
          preferences such as onboarding state. Vercel Analytics is enabled to measure
          site usage. The browser and hosting providers may also process technical
          request data needed to deliver and protect the site.
        </p>
      </Section>
      <Section title="How information is used and shared">
        <p>
          We use information to run accounts and learning features, save progress,
          answer support requests, prevent abuse, maintain the service, and understand
          aggregate site usage. Contact form submissions may be sent through EmailJS
          or your email app. Volunteer applications are stored in Supabase for review.
        </p>
        <p>
          If you use AI features, the relevant word, requested language, or help-chat
          messages are sent to the AI provider configured for that feature (which may
          include Google Gemini, NVIDIA NIM, or another configured provider) to produce
          a response. SpellyCraft does not store help-chat transcripts in its own
          application database; providers process requests under their own terms and
          retention practices. Do not include sensitive personal information in prompts.
        </p>
        <p>
          If you upload a profile photo, it is sent to ImgBB. The resulting image URL is
          saved to your profile; anyone who obtains a public image URL may be able to
          view that image. Speech requests may send the requested word and voice to our
          speech service, which can return or cache audio using Supabase Storage.
        </p>
      </Section>
      <Section title="Security and retention">
        <p>
          We use HTTPS for site connections, Supabase authentication, and database
          access controls including row-level policies where configured. Passwords are
          handled by Supabase Auth, not readable by SpellyCraft. These safeguards reduce
          risk, but no website or storage system can be guaranteed completely secure.
          Data is kept while needed to provide the service and handle legitimate
          operational or legal needs. You can request access, correction, or deletion by
          emailing us; we will review the request and explain any limits.
        </p>
      </Section>
      <Section title="Your choices and policy changes">
        <p>
          You can choose not to use optional AI or photo-upload features, clear browser
          storage through your browser settings, or contact us about your account data.
          Clearing browser storage may sign you out or remove locally cached settings.
          We may update this policy as the service changes; the effective date above
          shows the latest revision.
        </p>
      </Section>
      <Section title="Contact">
        <p>
          Privacy questions or data requests: email{" "}
          <a className="text-plum underline" href="mailto:info@spellycraft.com">
            info@spellycraft.com
          </a>
          . See also our <Link className="text-plum underline" to="/terms">Terms of Service</Link>.
        </p>
      </Section>
    </>
  );
}

export default function LegalPage() {
  const { pathname } = useLocation();
  const isPrivacy = pathname === "/privacy";
  const title = isPrivacy ? "Privacy Policy" : "Terms of Service";

  return (
    <div className="flex min-h-screen flex-col bg-white selection:bg-plum/20 selection:text-plum">
      <Helmet>
        <title>{title} | SpellyCraft</title>
        <meta
          name="description"
          content={
            isPrivacy
              ? "Learn how SpellyCraft handles account, learning, and technical data."
              : "Read the terms for using SpellyCraft learning tools."
          }
        />
      </Helmet>
      <PublicNavbar />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-10 sm:px-6 sm:py-14">
        {isPrivacy ? <PrivacyPolicy /> : <TermsOfService />}
      </main>
      <MinimalFooter />
    </div>
  );
}

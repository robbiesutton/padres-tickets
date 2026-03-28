import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Do Not Sell My Personal Information — BenchBuddy',
};

export default function DoNotSell() {
  return (
    <>
      <h1>Do Not Sell My Personal Information</h1>
      <p className="text-sm text-foreground/40">Last Updated: March 27, 2026</p>

      <h2>BenchBuddy Does Not Sell Your Personal Information</h2>
      <p>
        BenchBuddy does not sell, rent, or trade your personal information to third parties for
        monetary or other valuable consideration. We have never sold personal information and have
        no plans to do so.
      </p>
      <p>
        We also do not share your personal information for cross-context behavioral advertising
        purposes.
      </p>

      <h2>Your Rights Under the California Consumer Privacy Act (CCPA)</h2>
      <p>
        The California Consumer Privacy Act (CCPA), as amended by the California Privacy Rights Act
        (CPRA), gives California residents specific rights regarding their personal information.
        These include:
      </p>
      <ul>
        <li>
          <strong>Right to Know:</strong> You can request that we disclose the categories and
          specific pieces of personal information we have collected about you, the sources of that
          information, the business purposes for collecting it, and the categories of third parties
          with whom we share it.
        </li>
        <li>
          <strong>Right to Delete:</strong> You can request that we delete your personal
          information, subject to certain legal exceptions.
        </li>
        <li>
          <strong>Right to Correct:</strong> You can request that we correct inaccurate personal
          information that we maintain about you.
        </li>
        <li>
          <strong>Right to Opt Out of Sale or Sharing:</strong> Since we do not sell or share your
          personal information, there is no sale or sharing to opt out of. However, we still honor
          this right and provide this page for transparency.
        </li>
        <li>
          <strong>Right to Non-Discrimination:</strong> We will not discriminate against you for
          exercising any of your privacy rights.
        </li>
      </ul>

      <h2>How to Exercise Your Rights</h2>
      <p>
        If you are a California resident and would like to exercise any of your privacy rights, you
        may contact us at:
      </p>
      <p>
        Email: privacy@benchbuddy.com
      </p>
      <p>
        When you submit a request, we will verify your identity by confirming information
        associated with your account. We will respond to your request within 45 days as required by
        law.
      </p>

      <h2>Learn More</h2>
      <p>
        For complete details about how we collect, use, and protect your personal information,
        please read our full <a href="/privacy">Privacy Policy</a>.
      </p>
    </>
  );
}

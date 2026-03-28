import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy — BenchBuddy',
};

export default function CookiePolicy() {
  return (
    <>
      <h1>BenchBuddy Cookie Policy</h1>
      <p className="text-sm text-foreground/40">Last Updated: March 27, 2026</p>

      <h2>What Are Cookies</h2>
      <p>
        Cookies are small text files that are stored on your device (computer, tablet, or mobile
        phone) when you visit a website. They are widely used to make websites work more efficiently,
        provide a better user experience, and give website owners useful information about how their
        site is being used.
      </p>

      <h2>How BenchBuddy Uses Cookies</h2>
      <p>
        BenchBuddy uses a limited number of cookies to operate and improve the Service. We
        categorize our cookies as follows:
      </p>

      <h3>Essential Cookies</h3>
      <p>
        These cookies are strictly necessary for the Service to function and cannot be disabled.
        They include:
      </p>
      <ul>
        <li>
          <strong>Authentication cookies:</strong> These keep you logged in as you navigate between
          pages and return to the Service. Without these cookies, you would need to log in on every
          page.
        </li>
        <li>
          <strong>Session cookies:</strong> These maintain your session state and remember your
          preferences during a browsing session. They are typically deleted when you close your
          browser.
        </li>
      </ul>

      <h3>Analytics Cookies</h3>
      <p>
        These cookies help us understand how users interact with the Service so we can improve it.
        They collect information such as:
      </p>
      <ul>
        <li>Which pages are visited most frequently</li>
        <li>How users navigate through the Service</li>
        <li>Whether users encounter any errors</li>
        <li>General usage patterns and feature adoption</li>
      </ul>
      <p>
        Analytics cookies collect aggregated, anonymous information that does not directly identify
        you. You may opt out of analytics cookies without affecting the core functionality of the
        Service.
      </p>

      <h2>Managing Your Cookie Preferences</h2>
      <p>You can manage your cookie preferences in several ways:</p>
      <ul>
        <li>
          <strong>Cookie consent banner:</strong> When you first visit the Service, you will see a
          cookie consent banner that allows you to accept or decline non-essential cookies.
        </li>
        <li>
          <strong>Footer link:</strong> You can update your cookie preferences at any time by
          clicking the &quot;Cookie Preferences&quot; link in the footer of the website.
        </li>
        <li>
          <strong>Browser settings:</strong> Most web browsers allow you to control cookies through
          their settings. You can set your browser to refuse cookies, delete existing cookies, or
          alert you when a cookie is being set. Please note that disabling essential cookies may
          prevent you from using certain features of the Service, such as staying logged in.
        </li>
      </ul>

      <h2>Third-Party Cookies</h2>
      <p>
        We may use third-party analytics providers to help us understand how the Service is used.
        These providers may set their own cookies on your device when you visit the Service. We do
        not control the cookies set by third parties.
      </p>
      <p>
        Our analytics providers are contractually obligated to use the data they collect only for
        the purpose of providing analytics services to us and are not permitted to use your
        information for their own advertising purposes.
      </p>
      <p>
        For more information about how we handle your personal data, please see our Privacy Policy.
      </p>

      <h2>Contact Us</h2>
      <p>
        If you have questions about our use of cookies, please contact us:
      </p>
      <p>
        BenchBuddy
        <br />
        Email: privacy@benchbuddy.com
        <br />
        Website: www.benchbuddy.com
      </p>
    </>
  );
}

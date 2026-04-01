import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Acceptable Use Policy — BenchBuddy',
};

export default function AcceptableUsePolicy() {
  return (
    <>
      <h1>BenchBuddy Acceptable Use Policy</h1>
      <p className="text-sm text-foreground/40">Last Updated: March 27, 2026</p>

      <p>
        BenchBuddy is a coordination platform designed to help season ticket holders share tickets
        with friends, family, and trusted associates. This Acceptable Use Policy outlines the
        behaviors we expect from all users and the actions that are prohibited on our platform.
      </p>

      <h2>You Must</h2>
      <p>When using BenchBuddy, you are expected to:</p>
      <ul>
        <li>
          <strong>Share with people you know.</strong> BenchBuddy is designed for sharing tickets
          among friends, family, and trusted associates — people you have a personal relationship
          with.
        </li>
        <li>
          <strong>Use official apps for ticket transfers.</strong> All actual ticket transfers must
          be completed through your team&apos;s official ticketing channels (e.g., the MLB Ballpark
          App &quot;Forward&quot; feature, the NBA App, Ticketmaster). BenchBuddy coordinates who
          gets which tickets; it does not transfer the tickets themselves.
        </li>
        <li>
          <strong>Keep cost-sharing at face value.</strong> Any reimbursement coordinated through
          BenchBuddy should be limited to the face value of the ticket as originally purchased.
          BenchBuddy is not a platform for profiting from ticket sales.
        </li>
        <li>
          <strong>Comply with your team&apos;s season ticket agreement.</strong> You are responsible
          for understanding and following the terms of your season ticket holder agreement, including
          any rules about ticket transfers and sharing.
        </li>
        <li>
          <strong>Be respectful to other users.</strong> Treat your Sharing Circle members with
          courtesy and good faith. Communicate clearly and follow through on your commitments.
        </li>
      </ul>

      <h2>You Must Not</h2>
      <p>The following activities are strictly prohibited on BenchBuddy:</p>
      <ul>
        <li>
          <strong>No resale or scalping.</strong> Do not use BenchBuddy to resell tickets at any
          price. The platform is for coordination among people who know each other, not for
          commercial ticket sales.
        </li>
        <li>
          <strong>No sharing with strangers.</strong> Do not invite people you do not personally
          know into your Sharing Circles. BenchBuddy is not a marketplace for connecting with
          unknown buyers.
        </li>
        <li>
          <strong>No above-face-value pricing.</strong> Do not set cost-sharing amounts that exceed
          the face value of the ticket. Seeking to profit from ticket sharing violates this policy
          and may violate your season ticket agreement.
        </li>
        <li>
          <strong>No broker activity.</strong> Do not use BenchBuddy to conduct or facilitate any
          activity that would constitute &quot;Broker Activity&quot; as defined by MLB, NBA, or any
          other league&apos;s policies.
        </li>
        <li>
          <strong>No scraping or automation.</strong> Do not use bots, scrapers, scripts, or any
          automated means to access, collect data from, or interact with the Service.
        </li>
        <li>
          <strong>No fake accounts.</strong> Do not create accounts with false information,
          impersonate other people, or maintain multiple accounts for deceptive purposes.
        </li>
        <li>
          <strong>No malicious content.</strong> Do not submit, upload, or transmit any content
          that is harmful, threatening, abusive, harassing, defamatory, obscene, or otherwise
          objectionable. Do not attempt to introduce viruses, malware, or any other harmful code
          into the Service.
        </li>
      </ul>

      <h2>Enforcement</h2>
      <p>
        BenchBuddy takes violations of this Acceptable Use Policy seriously. If we determine that
        you have violated this policy, we may take one or more of the following actions at our sole
        discretion:
      </p>
      <ol>
        <li>
          <strong>Warning:</strong> We may issue a written warning notifying you of the violation
          and requesting that you cease the prohibited activity.
        </li>
        <li>
          <strong>Suspension:</strong> We may temporarily suspend your access to the Service while
          we investigate the violation or until the issue is resolved.
        </li>
        <li>
          <strong>Termination:</strong> We may permanently terminate your account and remove you
          from all Sharing Circles. Serious or repeated violations will result in immediate
          termination.
        </li>
        <li>
          <strong>Reporting:</strong> In cases involving potential fraud, illegal activity, or
          violations of team or league policies, we may report the activity to the relevant
          authorities, teams, or leagues.
        </li>
      </ol>

      <h2>Contact Us</h2>
      <p>
        If you have questions about this Acceptable Use Policy, or if you want to report a
        violation, please contact us:
      </p>
      <p>
        BenchBuddy
        <br />
        Email: hello@getbenchbuddy.com
        <br />
        Website: www.getbenchbuddy.com
      </p>
    </>
  );
}

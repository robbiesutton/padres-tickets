import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Guidelines — BenchBuddy',
};

export default function CommunityGuidelines() {
  return (
    <>
      <h1>BenchBuddy Community Guidelines</h1>
      <p className="text-sm text-foreground/40">Last Updated: March 27, 2026</p>

      <p>
        BenchBuddy is built on trust. Our platform works best when season ticket holders and their
        friends, family, and trusted associates treat each other with respect and good faith. These
        Community Guidelines outline the behaviors that make for a great experience for everyone.
      </p>

      <h2>Be a Good Sharing Circle Member</h2>
      <p>
        If you&apos;ve been invited to join a Sharing Circle, you&apos;re part of a group that
        trusts you. Honor that trust by:
      </p>
      <ul>
        <li>
          <strong>Only claiming games you&apos;ll actually attend.</strong> Don&apos;t claim seats
          you don&apos;t plan to use. If your plans change, release your claim promptly so someone
          else can enjoy the game.
        </li>
        <li>
          <strong>Reimbursing promptly.</strong> When you claim a game, pay your share of the
          face-value cost in a timely manner using whatever payment method your group has agreed
          upon. Don&apos;t make the ticket holder chase you for reimbursement.
        </li>
        <li>
          <strong>Communicating clearly.</strong> Let your group know if you can&apos;t make a game
          you&apos;ve claimed. Respond to messages and notifications in a reasonable timeframe.
        </li>
        <li>
          <strong>Respecting the ticket holder&apos;s rules.</strong> The season ticket holder sets
          the rules for their Sharing Circle. Respect their preferences regarding pricing, claim
          deadlines, and any other guidelines they establish.
        </li>
      </ul>

      <h2>Be a Good Season Ticket Holder</h2>
      <p>
        If you&apos;re a season ticket holder managing a Sharing Circle, set your group up for
        success by:
      </p>
      <ul>
        <li>
          <strong>Keeping your availability updated.</strong> Mark which games are available for
          sharing and which ones you&apos;re keeping for yourself. The sooner your circle knows
          what&apos;s available, the better they can plan.
        </li>
        <li>
          <strong>Setting clear expectations.</strong> Let your circle members know how you handle
          cost-sharing, claim deadlines, payment methods, and any other important details up front.
        </li>
        <li>
          <strong>Transferring tickets promptly.</strong> Once someone has claimed a game and
          arrangements are confirmed, transfer the tickets through the official app in a timely
          manner so they can plan with confidence.
        </li>
        <li>
          <strong>Being fair with pricing.</strong> Cost-sharing should be based on the face value
          of the tickets. BenchBuddy is a sharing tool, not a profit-making platform.
        </li>
      </ul>

      <h2>Keep It Friendly</h2>
      <p>BenchBuddy is a community. Help us keep it welcoming and positive:</p>
      <ul>
        <li>
          <strong>Be respectful.</strong> Treat everyone in your Sharing Circle the way you&apos;d
          want to be treated. Remember that everyone is here because they love going to games.
        </li>
        <li>
          <strong>No harassment or abuse.</strong> Harassment, threats, hate speech, discrimination,
          or any form of abusive behavior will not be tolerated.
        </li>
        <li>
          <strong>Resolve disagreements directly.</strong> If you have an issue with someone in your
          Sharing Circle, try to resolve it directly and respectfully. If you&apos;re unable to
          resolve a dispute, the Sharing Circle owner may remove members as they see fit.
        </li>
      </ul>

      <h2>Violations</h2>
      <p>
        We want everyone to have a great experience on BenchBuddy. If you violate these Community
        Guidelines, we may take action including:
      </p>
      <ol>
        <li>
          <strong>Warning:</strong> A notification that your behavior has violated our guidelines,
          with a request to correct it.
        </li>
        <li>
          <strong>Suspension:</strong> Temporary suspension of your account while we review the
          situation.
        </li>
        <li>
          <strong>Removal:</strong> Permanent removal from the platform for serious or repeated
          violations.
        </li>
      </ol>
      <p>
        If you see behavior that violates these guidelines, please report it to us at
        hello@getbenchbuddy.com.
      </p>
    </>
  );
}

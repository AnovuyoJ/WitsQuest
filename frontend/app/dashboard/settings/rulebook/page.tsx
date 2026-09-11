import Link from "next/link";
import { ScreenHeader } from "@/components/WitsScreen";

const sections = [
  { title: "Collect your cards", paragraphs: ["Visit an active event, verify your location and answer its challenges. A correct answer earns the reward card assigned to that challenge. Different challenges can award the same card, giving you extra copies. Each challenge can be answered once; replaying an answer does not earn another reward.", "Cards come in Blue, Black and Gold rarities. Event creators choose the reward and its challenge. Rarity does not guarantee a win: the card’s displayed battle points decide the round. All cards used in new battles have a whole-number score from 0 to 100."] },
  { title: "Build a five-card deck", paragraphs: ["Choose exactly 1 Gold, 2 Black and 2 Blue cards. Each must be a different card you own. You can combine cards from any events or categories. There is no token cost.", "Your deck locks when you start matchmaking. Its card details and points stay fixed for that match. You cannot add cards midway through a battle. If you do not have the required mix yet, complete more challenges or exchange eligible duplicates."] },
  { title: "Play five rounds", paragraphs: ["Choose one unused card each round. Both choices stay secret until both players submit. Higher battle points win one round; equal points draw the round. Categories are collection labels, not extra scoring bonuses.", "Each card can be played only once per match. Save strong cards for later or spend them early—it is your choice. After five rounds, the player with more round wins wins the match. Equal round wins mean a drawn match. Both players keep all their cards.", "You can cancel a waiting lobby. Quitting an active battle awards the match to your opponent. You can only have one waiting or active battle at a time."] },
  { title: "Play against the CPU", paragraphs: ["Choose Play against CPU for an immediate match. The CPU gets a virtual five-card deck with the same rarity mix, chosen from published rewards with points close to yours. Some cards may match your own.", "The CPU commits to a shuffled card order before you play your first card. It cannot inspect your choice and change its move. Its cards are not added to your collection, and CPU battles do not award collectible cards."] },
  { title: "Exchange duplicate cards", paragraphs: ["In My cards, choose a card with at least three extras. Exchange 3 extra copies of that same card for 1 unowned published reward of the same rarity from the same event. You choose the reward and confirm the exchange before any copies are spent.", "Example: you own 4 copies of the Gold Great Hall card. Exchange 3 extras for a different Gold reward from that event. You keep your original Great Hall card and receive the new card.", "Blue exchanges for Blue, Black for Black, and Gold for Gold. If no eligible unowned rewards remain, keep your extras for future rewards. Nothing is consumed. Exchanges are optional and final once confirmed."] },
  { title: "Older matches", paragraphs: ["Active matches started before the five-card update retain their original category rules and card-transfer behaviour. Open the match from Your battles to finish it, or forfeit it before starting a new match. Older waiting lobbies cannot receive new opponents; cancel them and build a five-card deck."] },
];

export default function RulebookPage() {
  return <div className="mx-auto max-w-4xl p-6 sm:p-10">
    <Link href="/dashboard/settings" className="text-sm font-semibold text-[#043673] underline">← Settings</Link>
    <div className="mt-6"><ScreenHeader eyebrow="How to play" title="Wits Quest rulebook" description="Collect across campus. Build your deck. Choose when to play your best cards." /></div>
    <nav aria-label="Rulebook contents" className="mb-8 flex flex-wrap gap-3">{sections.map((section,index) => <a key={section.title} href={`#rule-${index}`} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-[#043673]">{section.title}</a>)}</nav>
    <div className="space-y-5">{sections.map((section,index) => <section key={section.title} id={`rule-${index}`} className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-bold text-[#043673]">{index+1}. {section.title}</h2>
      {section.paragraphs.map(paragraph => <p key={paragraph} className="mt-3 text-sm leading-7 text-slate-600">{paragraph}</p>)}
    </section>)}</div>
    <Link href="/dashboard/games" className="mt-8 inline-block rounded-xl bg-[#043673] px-6 py-3 font-semibold text-white">Build your deck</Link>
  </div>;
}

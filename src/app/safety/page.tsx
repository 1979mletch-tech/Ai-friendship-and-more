import { SectionCard } from "@/components/section-card";

export default function SafetyPage() {
  return (
    <div className="space-y-6">
      <SectionCard
        title="Safety and support"
        description="AI Friendship is a conversational AI companion. It is not a human, not a therapist, and not emergency care."
      >
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-200">
          <li>If you are in immediate danger, contact local emergency services now.</li>
          <li>If you might harm yourself or someone else, seek urgent professional support immediately.</li>
          <li>If available in your location, contact your local crisis hotline or emergency mental health line.</li>
          <li>Reach out to a trusted person who can stay with you while you get help.</li>
        </ul>
      </SectionCard>
      <SectionCard
        title="Launch caution"
        description="Safety language, risk triggers, and escalation flows in this version are initial implementation only and require professional review before production launch."
      >
        <p className="text-sm text-slate-200">
          This screen intentionally avoids clinical claims and overconfident diagnosis. Use qualified experts to review and approve production safety policy.
        </p>
      </SectionCard>
    </div>
  );
}

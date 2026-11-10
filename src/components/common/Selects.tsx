import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubjectDot } from "@/components/common/Badges";
import type { Priority, Subject } from "@/types";

interface SubjectSelectProps {
  id: string;
  subjects: Subject[];
  value: string;
  onChange: (value: string) => void;
  /** Adds a "General" option with value "none". */
  allowNone?: boolean | undefined;
  invalid?: boolean | undefined;
  placeholder?: string | undefined;
}

export function SubjectSelect({
  id,
  subjects,
  value,
  onChange,
  allowNone,
  invalid,
  placeholder = "Select a subject",
}: SubjectSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} aria-invalid={invalid} className={invalid ? "border-destructive" : ""}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowNone && (
          <SelectItem value="none">
            <span className="flex items-center gap-2">
              <SubjectDot /> General
            </span>
          </SelectItem>
        )}
        {subjects.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            <span className="flex items-center gap-2">
              <SubjectDot subject={s} /> {s.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function PrioritySelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: Priority;
  onChange: (v: Priority) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Priority)}>
      <SelectTrigger id={id}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="high">High</SelectItem>
        <SelectItem value="medium">Medium</SelectItem>
        <SelectItem value="low">Low</SelectItem>
      </SelectContent>
    </Select>
  );
}

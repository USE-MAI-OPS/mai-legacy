import { Phone, Mail, MapPin, Cake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { EntryStructuredData } from "@/types/database";

interface ConnectionViewProps {
  entry: {
    title: string;
    content: string;
    structured_data?: EntryStructuredData | null;
  };
}

function FallbackContent({ content }: { content: string }) {
  return (
    <div className="space-y-4">
      {content.split("\n\n").map((paragraph, i) => (
        <p key={i} className="text-muted-foreground leading-relaxed">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ConnectionView({ entry }: ConnectionViewProps) {
  const sd = entry.structured_data;

  if (!sd || sd.type !== "connection") {
    return <FallbackContent content={entry.content} />;
  }

  const connection = sd.data;

  const contactItems = [
    {
      icon: Phone,
      label: "Phone",
      value: connection.phone,
      href: connection.phone ? `tel:${connection.phone}` : undefined,
    },
    {
      icon: Mail,
      label: "Email",
      value: connection.email,
      href: connection.email ? `mailto:${connection.email}` : undefined,
    },
    {
      icon: MapPin,
      label: "Address",
      value: connection.address,
      href: undefined,
    },
    {
      icon: Cake,
      label: "Birthday",
      value: connection.birthday,
      href: undefined,
    },
  ].filter((item) => item.value);

  return (
    <div className="space-y-8">
      {/* Avatar + Name + Relationship */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-24 items-center justify-center rounded-full bg-violet-100 text-3xl font-bold text-violet-700 ring-4 ring-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:ring-violet-800/50">
          {getInitials(connection.name)}
        </div>
        <div>
          <h3 className="text-2xl font-semibold">{connection.name}</h3>
          {connection.relationship && (
            <Badge
              variant="secondary"
              className="mt-2 bg-violet-100 px-3 py-1 text-sm text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
            >
              {connection.relationship}
            </Badge>
          )}
        </div>
      </div>

      {/* Contact Info Grid */}
      {contactItems.length > 0 && (
        <>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            {contactItems.map((item) => {
              const Icon = item.icon;
              const content = (
                <div className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
                    <Icon className="size-4.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="truncate text-sm font-medium">{item.value}</p>
                  </div>
                </div>
              );

              if (item.href) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className="no-underline"
                  >
                    {content}
                  </a>
                );
              }

              return <div key={item.label}>{content}</div>;
            })}
          </div>
        </>
      )}

      {/* Notes */}
      {connection.notes && (
        <>
          <Separator />
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Notes
            </h4>
            <p className="leading-relaxed text-foreground/90">
              {connection.notes}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

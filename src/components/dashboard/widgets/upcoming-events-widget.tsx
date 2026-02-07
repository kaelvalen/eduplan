import * as React from 'react';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { WidgetContainer, WidgetHeader, WidgetBody, WidgetFooter } from './widget-container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  type: 'lecture' | 'exam' | 'meeting' | 'deadline';
  time: string;
  location?: string;
  participants?: number;
  color: string;
}

interface UpcomingEventsWidgetProps {
  events?: Event[];
}

const typeLabels = {
  lecture: 'Ders',
  exam: 'Sınav',
  meeting: 'Toplantı',
  deadline: 'Son Tarih',
};

const defaultEvents: Event[] = [
  {
    id: '1',
    title: 'Veri Yapıları - Hafta 3',
    type: 'lecture',
    time: 'Bugün, 10:00',
    location: 'A-101',
    participants: 45,
    color: 'bg-blue-500',
  },
  {
    id: '2',
    title: 'Algoritma Analizi Final',
    type: 'exam',
    time: 'Yarın, 14:00',
    location: 'B-201',
    participants: 80,
    color: 'bg-rose-500',
  },
  {
    id: '3',
    title: 'Bölüm Toplantısı',
    type: 'meeting',
    time: '3 gün sonra, 15:30',
    location: 'Konferans Salonu',
    participants: 12,
    color: 'bg-purple-500',
  },
];

const UpcomingEventsWidgetComponent = ({ events = defaultEvents }: UpcomingEventsWidgetProps) => {
  return (
    <WidgetContainer>
      <WidgetHeader
        title="Yaklaşan Etkinlikler"
        subtitle="Bu haftanın programı"
        icon={Calendar}
        iconColor="bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400"
      />
      <WidgetBody padding={false}>
        <div className="divide-y divide-border/30">
          {events.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="inline-flex p-4 rounded-2xl bg-muted/30 mb-3">
                <Calendar className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">
                Yaklaşan etkinlik bulunmuyor
              </p>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="px-6 py-4 hover:bg-muted/20 transition-colors cursor-pointer group"
              >
                <div className="flex gap-4">
                  {/* Color Bar */}
                  <div className={cn('w-1 rounded-full', event.color)} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="text-sm font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
                        {event.title}
                      </h4>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {typeLabels[event.type]}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{event.time}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.participants && (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          <span>{event.participants} kişi</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </WidgetBody>
      <WidgetFooter>
        <Button variant="ghost" className="w-full justify-center text-sm">
          Tüm Programı Görüntüle
        </Button>
      </WidgetFooter>
    </WidgetContainer>
  );
};

export const UpcomingEventsWidget = React.memo(UpcomingEventsWidgetComponent);

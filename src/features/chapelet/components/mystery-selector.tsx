'use client';

import { Play } from 'lucide-react';

import { AudioPlayer } from '@/components/ui/audio-player/audio-player';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RosaryGroup } from '@/features/chapelet/api/get-rosary-groups';

interface MysterySelectorProps {
  todayGroup: RosaryGroup;
  groups: RosaryGroup[];
  selectedGroup: RosaryGroup;
  onSelectGroup: (g: RosaryGroup) => void;
  onStartGuide: () => void;
}

export function MysterySelector({
  todayGroup,
  groups,
  selectedGroup,
  onSelectGroup,
  onStartGuide,
}: MysterySelectorProps) {
  const mysteriesList = [...selectedGroup.mysteries].sort(
    (a, b) => a.order - b.order,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {groups.map((group) => {
          const isSelected = group.id === selectedGroup.id;
          const isToday = group.id === todayGroup.id;
          return (
            <button
              key={group.id}
              onClick={() => onSelectGroup(group)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {group.name}
              {isToday && !isSelected && (
                <span className="ml-1.5 inline-block size-1.5 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected mystery details */}
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="bg-accent/5 p-4 dark:bg-accent/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                Mystères {selectedGroup.name}
              </CardTitle>
            </div>
            {selectedGroup.id === todayGroup.id && (
              <Badge variant="secondary" className="bg-accent/10 text-accent">
                Aujourd&apos;hui
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-0 p-0">
          {mysteriesList.length > 0 ? (
            mysteriesList.map((mystery, i) => (
              <div
                key={mystery.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                  {i + 1}
                </span>
                <span className="text-sm text-foreground">{mystery.title}</span>
              </div>
            ))
          ) : (
            <div className="p-4 text-sm text-foreground">
              Aucun mystère disponible.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <Button
          size="lg"
          onClick={onStartGuide}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          icon={<Play className="size-4" />}
        >
          Commencer le chapelet guidé
        </Button>
        {selectedGroup.audio_file && (
          <AudioPlayer
            src={selectedGroup.audio_file}
            title={`${selectedGroup.name} — Audio`}
          />
        )}
      </div>
    </div>
  );
}

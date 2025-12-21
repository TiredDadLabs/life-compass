import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Clock, Users, Calendar, Sparkles, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { differenceInDays, format, subDays } from 'date-fns';

interface Person {
  id: string;
  name: string;
  relationship: string;
  last_quality_time: string | null;
}

interface SharedActivity {
  personId: string;
  count: number;
  lastActivity: Date | null;
  totalMinutes: number;
}

interface RelationshipHealth {
  person: Person;
  daysSinceConnection: number | null;
  sharedActivities: number;
  totalQualityMinutes: number;
  status: 'thriving' | 'connected' | 'missing' | 'unknown';
  insight: string;
}

const getStatusConfig = (status: RelationshipHealth['status']) => {
  switch (status) {
    case 'thriving':
      return {
        color: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
        icon: Sparkles,
        label: 'Thriving'
      };
    case 'connected':
      return {
        color: 'bg-sky-500/20 text-sky-700 dark:text-sky-300',
        icon: Heart,
        label: 'Connected'
      };
    case 'missing':
      return {
        color: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
        icon: AlertCircle,
        label: 'Missing you'
      };
    default:
      return {
        color: 'bg-muted text-muted-foreground',
        icon: Clock,
        label: 'No data yet'
      };
  }
};

const getRelationshipLabel = (relationship: string) => {
  const labels: Record<string, string> = {
    partner: 'Partner',
    child: 'Child',
    parent: 'Parent',
    sibling: 'Sibling',
    friend: 'Friend',
    other: 'Other'
  };
  return labels[relationship] || relationship;
};

export function RelationshipHealthSignals() {
  const { user } = useAuth();
  const [relationships, setRelationships] = useState<RelationshipHealth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchRelationshipHealth = async () => {
      try {
        // Fetch people
        const { data: people } = await supabase
          .from('people')
          .select('id, name, relationship, last_quality_time')
          .eq('user_id', user.id);

        if (!people || people.length === 0) {
          setRelationships([]);
          setLoading(false);
          return;
        }

        // Fetch goal logs with people involved (last 30 days)
        const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
        const { data: goalLogs } = await supabase
          .from('goal_logs')
          .select('people_involved, logged_at, duration_minutes')
          .eq('user_id', user.id)
          .gte('logged_at', thirtyDaysAgo);

        // Calculate shared activities per person
        const activityMap: Record<string, SharedActivity> = {};
        
        people.forEach(p => {
          activityMap[p.id] = {
            personId: p.id,
            count: 0,
            lastActivity: null,
            totalMinutes: 0
          };
        });

        if (goalLogs) {
          goalLogs.forEach(log => {
            if (log.people_involved && Array.isArray(log.people_involved)) {
              log.people_involved.forEach((personId: string) => {
                if (activityMap[personId]) {
                  activityMap[personId].count++;
                  activityMap[personId].totalMinutes += log.duration_minutes || 0;
                  const logDate = new Date(log.logged_at);
                  if (!activityMap[personId].lastActivity || logDate > activityMap[personId].lastActivity!) {
                    activityMap[personId].lastActivity = logDate;
                  }
                }
              });
            }
          });
        }

        // Build relationship health data
        const healthData: RelationshipHealth[] = people.map(person => {
          const activity = activityMap[person.id];
          const lastConnection = person.last_quality_time 
            ? new Date(person.last_quality_time)
            : activity.lastActivity;
          
          const daysSince = lastConnection 
            ? differenceInDays(new Date(), lastConnection)
            : null;

          // Determine status based on relationship type and days
          let status: RelationshipHealth['status'] = 'unknown';
          let insight = '';

          if (daysSince === null) {
            insight = `Start tracking quality time with ${person.name}`;
          } else if (person.relationship === 'partner') {
            if (daysSince <= 2 && activity.count >= 3) {
              status = 'thriving';
              insight = `Strong connection—${activity.count} shared moments this month`;
            } else if (daysSince <= 5) {
              status = 'connected';
              insight = `Last connected ${daysSince === 0 ? 'today' : daysSince === 1 ? 'yesterday' : `${daysSince} days ago`}`;
            } else {
              status = 'missing';
              insight = `${daysSince} days since quality time together`;
            }
          } else if (person.relationship === 'child') {
            if (daysSince <= 1 && activity.count >= 5) {
              status = 'thriving';
              insight = `Lots of quality time—${activity.count} activities together`;
            } else if (daysSince <= 3) {
              status = 'connected';
              insight = `Connected ${daysSince === 0 ? 'today' : `${daysSince} days ago`}`;
            } else {
              status = 'missing';
              insight = `${daysSince} days since dedicated time`;
            }
          } else if (['parent', 'sibling'].includes(person.relationship)) {
            if (daysSince <= 7 && activity.count >= 2) {
              status = 'thriving';
              insight = `Regular connection—${activity.count} interactions this month`;
            } else if (daysSince <= 14) {
              status = 'connected';
              insight = `Last reached out ${daysSince} days ago`;
            } else {
              status = 'missing';
              insight = `It's been ${daysSince} days—time to reconnect?`;
            }
          } else {
            // Friends and others
            if (daysSince <= 14 && activity.count >= 2) {
              status = 'thriving';
              insight = `Active friendship—${activity.count} hangouts this month`;
            } else if (daysSince <= 30) {
              status = 'connected';
              insight = `Connected ${daysSince} days ago`;
            } else {
              status = 'missing';
              insight = `${daysSince} days since you connected`;
            }
          }

          return {
            person,
            daysSinceConnection: daysSince,
            sharedActivities: activity.count,
            totalQualityMinutes: activity.totalMinutes,
            status,
            insight
          };
        });

        // Sort: missing first, then by days since connection
        healthData.sort((a, b) => {
          const statusOrder = { missing: 0, unknown: 1, connected: 2, thriving: 3 };
          if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status];
          }
          return (b.daysSinceConnection || 999) - (a.daysSinceConnection || 999);
        });

        setRelationships(healthData);
      } catch (error) {
        console.error('Error fetching relationship health:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelationshipHealth();
  }, [user]);

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-rose-500" />
            Relationship Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (relationships.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-rose-500" />
            Relationship Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Add people you care about to track relationship health
          </p>
        </CardContent>
      </Card>
    );
  }

  const missingCount = relationships.filter(r => r.status === 'missing').length;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-rose-500" />
            Relationship Health
          </CardTitle>
          {missingCount > 0 && (
            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
              {missingCount} need attention
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {relationships.slice(0, 5).map(({ person, daysSinceConnection, sharedActivities, totalQualityMinutes, status, insight }) => {
          const config = getStatusConfig(status);
          const StatusIcon = config.icon;

          return (
            <div
              key={person.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className={`p-2 rounded-full ${config.color}`}>
                <StatusIcon className="h-4 w-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{person.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {getRelationshipLabel(person.relationship)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {insight}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1">
                {sharedActivities > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{sharedActivities} activities</span>
                  </div>
                )}
                {totalQualityMinutes > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{Math.round(totalQualityMinutes / 60)}h quality time</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {relationships.length > 5 && (
          <p className="text-xs text-center text-muted-foreground pt-2">
            +{relationships.length - 5} more relationships
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Typy modelu danych panelu lokalnego (mockup).
// Pliki w src/ są kompilowane jako skrypty globalne (bez import/export), ładowane w kolejności numerów.

type ServiceState = 'running' | 'stopped' | 'starting' | 'restarting' | 'failed' | 'not-installed';
type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
type Channel = 'stable' | 'pilot';
type PendingStatus = 'pending' | 'scheduled' | 'rejected';
type StepStatus = 'pending' | 'running' | 'ok' | 'failed' | 'skipped';
type OpType =
  | 'install' | 'update' | 'rollback-auto' | 'rollback' | 'reject' | 'reconsider' | 'schedule' | 'unschedule'
  | 'config' | 'policy' | 'settings' | 'import' | 'package-rejected' | 'service-restart' | 'agent-update' | 'port-change';
type OpResult = 'running' | 'success' | 'rolled-back' | 'failed' | 'done' | 'cancelled';
type Reported = 'sent' | 'buffered' | 'failed';
type FieldType = 'text' | 'fqdn' | 'port' | 'path' | 'number' | 'select' | 'bool' | 'secret' | 'id';
type ScenarioKey = 'fresh' | 'normal' | 'offline' | 'rolledback';
type Override = 'none' | 'loading' | 'empty' | 'error';
type BadgeKind = 'ok' | 'warn' | 'danger' | 'info' | 'accent' | 'neutral';
type BtnKind = 'primary' | 'secondary' | 'danger' | 'ghost';

interface HealthJob { name: string; alive: boolean; lastRun: string; }

interface HealthResult {
  status: HealthStatus;
  appVersion: string;
  schemaCurrent: number;
  schemaExpected: number;
  dbReachable: boolean;
  dbInstance: string;
  latencyMs: number;
  jobs: HealthJob[];
  startedAt: string;
  checkedAt: string;
  message?: string;
}

interface Impact { requiresRestart: boolean; schemaMigration: boolean; urgent: boolean; }

interface PendingVersion {
  version: string;
  channel: Channel;
  releaseDate: string;
  offeredAt: string;
  notes: string[];
  impact: Impact;
  minAgentVersion: string;
  sizeMb: number;
  status: PendingStatus;
  scheduledAt?: string;
  deferOnSessions?: boolean;
  rejected?: { at: string; by: string; reason: string; };
  faulty?: boolean;
  faultReason?: string;
  annotation?: string;
  isFirstInstall?: boolean;
}

interface DiskVersion { version: string; installedAt: string; sizeMb: number; }

interface Policy { enabled: boolean; days: number[]; from: string; to: string; skipOnSessions: boolean; }

interface SelectOption { value: string; label: string; }

interface ConfigField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  restart: boolean;
  help?: string;
  placeholder?: string;
  options?: SelectOption[];
  pattern?: string;
  patternMessage?: string;
  newInVersion?: string;
}

interface ConfigSection { key: string; title: string; fields: ConfigField[]; }
interface SecretMeta { isSet: boolean; changedAt?: string; changedBy?: string; }
type ConfigValue = string | boolean | number | null;

interface AppConfig {
  schemaVersion: string;
  sections: ConfigSection[];
  values: Record<string, ConfigValue>;
  secrets: Record<string, SecretMeta>;
}

interface DbSession { user: string; host: string; app: string; since: string; }

interface App {
  name: string;
  title: string;
  prefix: string;
  port: number | null;
  service: ServiceState;
  installed: string | null;
  installedAt?: string;
  health: HealthResult | null;
  pending: PendingVersion[];
  disk: DiskVersion[];
  policy: Policy;
  config: AppConfig;
  note?: string;
  restartLoop?: number;
  isPlatform?: boolean;
  dbInstance?: string;
  dbFile?: string;
  sessions: DbSession[];
}

interface OpStep { key: string; title: string; status: StepStatus; detail?: string; durationMs?: number; }

interface Operation {
  id: string;
  type: OpType;
  app: string;
  appTitle: string;
  fromVersion?: string;
  toVersion?: string;
  actor: string;
  startedAt: string;
  finishedAt?: string;
  result: OpResult;
  steps: OpStep[];
  log: string[];
  reported: Reported;
  summary?: string;
  failReason?: string;
  details?: string[];
}

interface PanelNotification { id: string; kind: 'error' | 'warning' | 'info'; text: string; link?: string; linkLabel?: string; }

interface Certificate { subject: string; issuer: string; validTo: string; thumbprint: string; trusted: boolean; selfIssued: boolean; }

interface Site {
  name: string;
  siteId: string;
  server: string;
  fqdn: string;
  windowsAccount: string;
  infoSystem: { host: string; port: number; connected: boolean; lastContact: string; lastReport: string; buffered: number; };
  nginx: { state: ServiceState; port: number; version: string; port443Free: boolean; };
  disk: { freeGb: number; totalGb: number; usedByPlatformGb: number; };
  agent: { version: string; available?: string; account: string; pollMinutes: number; bandwidth: string; keepVersions: number; ramMb: number; installDir: string; dataDir: string; };
  bootstrap: OpStep[];
  wizardDismissed: boolean;
  support: { phone: string; email: string; };
  cert: Certificate;
  firewallManaged: boolean;
}

interface AppState { site: Site; apps: App[]; operations: Operation[]; notifications: PanelNotification[]; }

interface DemoState { scenario: ScenarioKey; override: Override; open: boolean; agentRestarting: boolean; }

interface PreflightCheck {
  key: string;
  title: string;
  status: 'ok' | 'warn' | 'fail' | 'unknown' | 'running';
  detail: string;
  blocking: boolean;
  items?: string[];
  link?: { label: string; href: string; };
}

interface PlanStep { step: OpStep; ms: number; outcome?: () => StepStatus; logs?: string[]; onDone?: () => void; }

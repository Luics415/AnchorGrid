interface Props {
  connected: boolean;
  isHost?: boolean;
  epoch?: number;
  revision?: number;
  compact?: boolean;
}

export function NetworkStatus({ connected, isHost = false, epoch, revision, compact = false }: Props) {
  return (
    <div className={`network-status ${connected ? 'online' : 'offline'} ${compact ? 'compact' : ''}`}>
      <span className="network-dot" />
      <span>{connected ? 'Sincronizado' : 'Reconectando'}</span>
      {connected && isHost && <b>HOST</b>}
      {!compact && typeof epoch === 'number' && <small>E{epoch}</small>}
      {!compact && typeof revision === 'number' && <small>R{revision}</small>}
    </div>
  );
}

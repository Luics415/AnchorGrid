interface Props {
  compact?: boolean;
  className?: string;
}

export function BrandSignature({ compact = false, className = '' }: Props) {
  return (
    <div className={`brand-signature ${compact ? 'compact' : ''} ${className}`.trim()}>
      <img src={`${import.meta.env.BASE_URL}brand/signature.webp`} alt="Luics415" />
    </div>
  );
}

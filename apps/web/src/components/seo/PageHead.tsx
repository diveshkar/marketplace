import { Helmet } from 'react-helmet-async';

const APP_NAME = 'Marketplace';

type Props = {
  title?: string;
  description?: string;
};

/**
 * Sets per-page <title> and meta description.
 * Title format: "Page Title | Marketplace"  (or just "Marketplace" for home).
 */
export function PageHead({ title, description }: Props) {
  const fullTitle = title ? `${title} | ${APP_NAME}` : APP_NAME;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
    </Helmet>
  );
}

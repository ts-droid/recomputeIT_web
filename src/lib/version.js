import pkg from '../../package.json';

const SEMVER_REGEX = /^v?\d+\.\d+\.\d+$/;

export const getDisplayVersion = () => {
  const envVersion = import.meta.env.VITE_APP_VERSION || '';
  if (SEMVER_REGEX.test(envVersion)) {
    return envVersion.replace(/^v/, '');
  }
  return pkg.version || '0.0.0';
};

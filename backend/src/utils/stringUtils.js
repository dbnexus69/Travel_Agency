const formatName = (str) => {
  if (!str || typeof str !== 'string') return str || '';
  return str.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

module.exports = {
  formatName
};

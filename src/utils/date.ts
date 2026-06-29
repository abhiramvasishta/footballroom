export const formatISTDate = (isoString: string): string => {
  const d = new Date(isoString);
  const datePart = d.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });
  const timePart = d.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
  return `${datePart} • ${timePart} IST`;
};

export const formatISTTimeOnly = (isoString: string): string => {
  const d = new Date(isoString);
  const timePart = d.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
  return `${timePart} IST`;
};

export const formatISTDateOnly = (isoString: string): string => {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short' });
};

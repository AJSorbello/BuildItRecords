export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const sortByDate = (a: string, b: string): number => {
  return new Date(b).getTime() - new Date(a).getTime();
};

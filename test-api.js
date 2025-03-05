const main = async () => {
  const { default: fetch } = await import('node-fetch');

  try {
    const url = 'http://localhost:3001/api/releases?label=buildit-records';
    console.log('Testing API at:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    console.log('Found releases:', data.releases ? data.releases.length : 0);
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
};

main();

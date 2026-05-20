const reExampleResponse = /```response(:(\d+))?\n([\s\S]*?)\n```/gm;

export default function extractExamples(description) {
  if (!description) {
    return { description: '', exampleResponses: [] };
  }

  const exampleResponses = [];
  let match;
  const re = new RegExp(reExampleResponse.source, 'gm');
  while ((match = re.exec(description))) {
    exampleResponses.push({
      code: match[2] || null,
      value: match[3].trim()
    });
  }

  return {
    description: description.replace(re, ''),
    exampleResponses
  };
}

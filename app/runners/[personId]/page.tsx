export default function RunnerPage({
  params,
}: {
  params: { personId: string };
}) {
  return (
    <div>
      <h1>Runner Details</h1>
      <p>Runner ID: {params.personId}</p>
      {/* Add more details here when you implement the runner page */}
    </div>
  );
}

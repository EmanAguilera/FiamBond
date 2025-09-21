import GoalManager from '../../Components/GoalManager'; // Adjust the path to your new component

export default function Goals() {
  return (
    <>
      <h1 className="title">Set Your Financial Goals</h1>
      
      {/* The GoalManager component handles everything else */}
      <div className="w-full max-w-3xl mx-auto">
        <GoalManager />
      </div>
    </>
  );
}
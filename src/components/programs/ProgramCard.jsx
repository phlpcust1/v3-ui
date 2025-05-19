/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";
const ProgramCard = ({ program }) => {
  const passed = program.gradeSummary?.passed ?? 0;
  const failed = program.gradeSummary?.failed ?? 0;

  return (
    <>
      <Link to={`/programs/coach-list/${program.id}`}>
        <div className="border-2 w-96 h-96 rounded-lg text-left  shadow-lg cursor-pointer">
          <div className="bg-orange-100 rounded-t-lg px-2 flex justify-center items-center">
            <img
              src={`/${program.code.toLowerCase()}.png`}
              alt=""
              className="h-[160px] w-[300px]"
            />
          </div>
          <div className="h- px-5 pt-4 pb-4 flex flex-col justify-betwee">
            <p className="font-bold"> {program.name}</p>
            <div className="mt-7">
              <p className="text-sm font-medium text-gray-500">No. of Coach</p>
              <p className="text-base font-medium">
                {program.coaches.length} Curriculum Coach
              </p>
            </div>
            <div className="mt-7">
              <p className="text-sm font-medium">{passed} Students Passed</p>
              <p className="text-sm font-medium">{failed} Students Failed</p>
            </div>
          </div>
        </div>
      </Link>
    </>
  );
};

export default ProgramCard;

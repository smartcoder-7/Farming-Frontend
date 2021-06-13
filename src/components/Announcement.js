import { CgInfo } from 'react-icons/cg';

const Announcement = ({ title, children }) => {
  return (
    <div className="relative w-full">
      <div className="flex flex-col space-y-1 rounded-lg bg-gray-100 dark:bg-gray-900 p-3">
        <div className="text-sm">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-1 cursor-pointer">
            <div className="flex items-center space-x-1 flex-auto font-semibold text-sm sm:text-base">
              <CgInfo className="text-xl" />
              <div>{title}</div>
            </div>
          </div>
          { children &&
            <div className="mt-2 max-w-md m-auto sm:mx-0">
              { children }
            </div>
          }
        </div>
      </div>
      <div className="absolute transform -translate-x-1/2 -translate-y-1/2 top-0 left-0" >
        <div className="w-5 h-5 bg-yellow-400 rounded-full" />
      </div>
    </div>
  )
}

export default Announcement;


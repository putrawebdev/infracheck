import { useLocationContext } from '../context/LocationContext';

export const useLocation = () => {
  return useLocationContext();
};

export default useLocation;

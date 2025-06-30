// Mock react-router-dom components for testing
export const MemoryRouter = ({ children }) => children;
export const BrowserRouter = ({ children }) => children;
export const Routes = ({ children }) => children;
export const Route = ({ element }) => element;
export const useNavigate = () => jest.fn();
export const useLocation = () => ({
  pathname: '/',
  search: '',
  hash: '',
  state: null
});
export const useParams = () => ({});

export default {
  MemoryRouter,
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
  useParams
};
/**
 * Shared initialization for Vercel serverless functions.
 * Loads dotenv once and re-exports the key server modules so that
 * every api/ handler can do:
 *   import { polarAgent, ... } from '../_shared/init';
 *
 * The `_shared` prefix with underscore means Vercel will NOT treat
 * this directory as a route.
 */
import dotenv from 'dotenv';
dotenv.config();

export { polarAgent } from '../../server/agent/polarAgent';
export {
  syncServerStore,
  executeOperationalAction,
  getPendingOperationalAction,
  rejectOperationalAction,
} from '../../server/agent/dbTools';
export { weatherService } from '../../server/services/weather/weatherProvider';

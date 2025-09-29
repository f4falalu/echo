import { Hono } from 'hono';
import { standardErrorHandler } from '../../../../utils/response';
import GET from './GET';
import DATA from './data/GET';
import DOWNLOAD from './download/GET';
import SHARING from './sharing';

const app = new Hono()
  .route('/', GET)
  .route('/data', DATA)
  .route('/download', DOWNLOAD)
  .route('/sharing', SHARING)
  .onError(standardErrorHandler);

export default app;

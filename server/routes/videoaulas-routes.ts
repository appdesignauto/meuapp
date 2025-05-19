import express from 'express';
import { 
  getLesson, 
  getModule, 
  getAllModules, 
  markLessonAsViewed, 
  markLessonAsCompleted, 
  getCourseProgress, 
  saveNote,
  getNotes,
  getLastWatchedLesson,
  getWatchHistory,
  getCoursesStatistics,
  getRecentComments,
  getMostWatchedLessons
} from '../controllers/videoaulasController';

const router = express.Router();

// Rotas públicas
router.get('/aula/:id', getLesson);
router.get('/modulo/:id', getModule);
router.get('/modulos', getAllModules);

// Rotas protegidas (requerem autenticação)
// A autenticação será aplicada na configuração das rotas em routes.ts
router.post('/visualizacao/:id', markLessonAsViewed);
router.post('/completar/:id', markLessonAsCompleted);
router.get('/progresso/:id', getCourseProgress);
router.post('/anotacao/:id', saveNote);
router.get('/anotacao/:id', getNotes);
router.get('/ultima-aula', getLastWatchedLesson);
router.get('/historico-aulas', getWatchHistory);

// Rotas de administração e estatísticas
router.get('/estatisticas', getCoursesStatistics);
router.get('/comentarios-recentes', getRecentComments);
router.get('/aulas-mais-assistidas', getMostWatchedLessons);

export default router;
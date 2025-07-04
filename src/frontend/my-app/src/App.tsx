import { Route, Routes } from 'react-router-dom';
import './App.css'
import MainLayout from './layout/MainLayout';
import { Profile } from './pages/profile';
import { Search } from './pages/search';
import { Like } from './pages/likes';
import { Match } from './pages/match';
import { Top } from './pages/Top';
import { Case } from './pages/сase';

function App() {
  return (
    <Routes>
      <Route path='/' element={<MainLayout />}>
        <Route path='/profile' element={<Profile />} />
        <Route path='/search' element={<Search />} />
        <Route path='/likes' element={<Like />} />
        <Route path='/match' element={<Match />} />
        <Route path='/top' element={<Top />} />
        <Route path='/case' element={<Case />} />
      </Route>
    </Routes>
  )
}

export default App

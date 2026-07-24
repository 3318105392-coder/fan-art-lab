import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import PhotocardEditor from './pages/editor/PhotocardEditor'
import PolaroidEditor from './pages/editor/PolaroidEditor'
import StickerEditor from './pages/editor/StickerEditor'
import PostcardEditor from './pages/editor/PostcardEditor'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="editor/photocard" element={<PhotocardEditor />} />
          <Route path="editor/polaroid" element={<PolaroidEditor />} />
          <Route path="editor/sticker" element={<StickerEditor />} />
          <Route path="editor/postcard" element={<PostcardEditor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

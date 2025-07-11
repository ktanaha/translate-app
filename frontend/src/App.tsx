import React, { useState } from 'react';
import './App.css';
import { TranslationForm } from './components/TranslationForm';
import { MultiTranslationForm } from './components/MultiTranslationForm';

function App() {
  const [activeTab, setActiveTab] = useState<'single' | 'multi'>('single');

  return (
    <div className="App">
      <header className="App-header">
        <h1>ランダム翻訳サービス</h1>
        <p>短い文章をランダムな言語に翻訳してから日本語に戻します</p>
      </header>
      <main className="App-main">
        <div className="tabs-container">
          <div className="tabs-header">
            <button 
              className={`tab-button ${activeTab === 'single' ? 'active' : ''}`}
              onClick={() => setActiveTab('single')}
            >
              単発翻訳
            </button>
            <button 
              className={`tab-button ${activeTab === 'multi' ? 'active' : ''}`}
              onClick={() => setActiveTab('multi')}
            >
              複数回翻訳
            </button>
          </div>
          <div className="tab-content">
            {activeTab === 'single' && <TranslationForm />}
            {activeTab === 'multi' && <MultiTranslationForm />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

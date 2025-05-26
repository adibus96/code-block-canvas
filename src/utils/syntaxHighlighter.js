import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'

// Import language components
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-java'
// Temporarily disable C++ imports to avoid dependency issues
// import 'prismjs/components/prism-clike'
// import 'prismjs/components/prism-cpp'

// Language detection patterns
const languagePatterns = {
  python: /\b(def|import|from|class|if __name__|print\(|range\()\b/,
  java: /\b(public class|private|protected|public static void main|System\.out\.println)\b/,
  typescript: /\b(interface|type|enum|implements|extends)\b/,
  javascript: /\b(function|const|let|var|=>|console\.log|document\.|window\.)\b/,
  // Temporarily disable C++ to avoid the error
  // cpp: /\b(#include|std::|cout|cin|namespace|using namespace)\b/,
}

export function detectLanguage(code) {
  for (const [lang, pattern] of Object.entries(languagePatterns)) {
    if (pattern.test(code)) {
      return lang
    }
  }
  return 'javascript' // default
}

export function highlightCode(code, language = null) {
  if (!language) {
    language = detectLanguage(code)
  }
  
  try {
    // Check if the language is available, fallback to javascript, then to plain text
    const grammar = Prism.languages[language] || Prism.languages.javascript || null
    
    if (!grammar) {
      console.warn(`Language '${language}' not available, using plain text`)
      return [{ text: code, color: '#333333' }]
    }
    
    const highlighted = Prism.highlight(code, grammar, language)
    return parseHighlightedCode(highlighted)
  } catch (error) {
    console.warn('Syntax highlighting failed:', error)
    return [{ text: code, color: '#333333' }]
  }
}

function parseHighlightedCode(highlightedHtml) {
  // Convert HTML with syntax highlighting to array of text segments with colors
  const segments = []
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = highlightedHtml
  
  const colorMap = {
    'token keyword': '#c792ea',
    'token string': '#c3e88d',
    'token comment': '#546e7a',
    'token number': '#f78c6c',
    'token function': '#82aaff',
    'token operator': '#89ddff',
    'token punctuation': '#89ddff',
    'token property': '#f07178',
    'token class-name': '#ffcb6b',
  }
  
  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      segments.push({
        text: node.textContent,
        color: '#333333'
      })
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const className = node.className
      const color = colorMap[className] || '#333333'
      
      if (node.children.length === 0) {
        segments.push({
          text: node.textContent,
          color: color
        })
      } else {
        for (const child of node.childNodes) {
          processNode(child)
        }
      }
    }
  }
  
  for (const child of tempDiv.childNodes) {
    processNode(child)
  }
  
  return segments.length > 0 ? segments : [{ text: highlightedHtml.replace(/<[^>]*>/g, ''), color: '#333333' }]
}

export function getLanguageIcon(language) {
  const icons = {
    javascript: '🟨',
    typescript: '🔷',
    python: '🐍',
    java: '☕',
    // cpp: '⚡', // Temporarily disabled
  }
  return icons[language] || '📄'
} 
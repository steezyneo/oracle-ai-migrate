import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2,
  Minimize2,
  Maximize2,
  Sparkles,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useAuth } from "../hooks/useAuth";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isLoading?: boolean;
}

interface CosmoChatProps {
  className?: string;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyAjp-ksF02c3YosUv4rvULe9nrSrVkjmVY";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const CosmoChat: React.FC<CosmoChatProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm Cosmo Agents, your AI assistant. I can help you with Oracle SQL, Python programming, and answer questions about this Sybase to Oracle migration tool. How can I assist you today?",
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useGemini, setUseGemini] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Add loading message
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      sender: 'bot',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, loadingMessage]);

    try {
      let response: string;
      
      if (useGemini) {
        response = await generateGeminiResponse(inputValue.trim());
      } else {
        response = await generateLocalResponse(inputValue.trim());
      }
      
      // Remove loading message and add actual response
      setMessages(prev => prev.filter(msg => !msg.isLoading).concat({
        id: (Date.now() + 2).toString(),
        content: response,
        sender: 'bot',
        timestamp: new Date(),
      }));
    } catch (error) {
      console.error('Error generating response:', error);
      // Fallback to local response if Gemini fails
      try {
        const fallbackResponse = await generateLocalResponse(inputValue.trim());
        setMessages(prev => prev.filter(msg => !msg.isLoading).concat({
          id: (Date.now() + 2).toString(),
          content: fallbackResponse,
          sender: 'bot',
          timestamp: new Date(),
        }));
      } catch (fallbackError) {
        // Remove loading message and add error response
        setMessages(prev => prev.filter(msg => !msg.isLoading).concat({
          id: (Date.now() + 2).toString(),
          content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
          sender: 'bot',
          timestamp: new Date(),
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateGeminiResponse = async (userInput: string): Promise<string> => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      const prompt = `You are Cosmo Agents, an AI assistant for a Sybase to Oracle migration tool. You help users with:

1. Oracle SQL and PL/SQL questions
2. Python programming questions
3. Questions about the migration tool and its features
4. General technical support

User question: "${userInput}"

Respond with a brief, clear, and to-the-point answer. Only include code or examples if absolutely necessary. Avoid long explanations. Use markdown for code blocks if needed.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  };

  const generateLocalResponse = async (userInput: string): Promise<string> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const input = userInput.toLowerCase();
    
    // Oracle SQL related questions
    if (input.includes('oracle') && input.includes('sql')) {
      if (input.includes('syntax') || input.includes('basic')) {
        return `**Oracle SQL Example:**\n\n\`\`\`sql\nSELECT * FROM table_name WHERE condition;\n\`\`\`\nUse ROWNUM for limits. Need more? Ask!`;
      }
      
      if (input.includes('procedure') || input.includes('function')) {
        return `**PL/SQL Procedure Example:**\n\n\`\`\`sql\nCREATE OR REPLACE PROCEDURE my_proc AS BEGIN NULL; END;\n\`\`\`\nLet me know if you want details!`;
      }
      
      if (input.includes('data type') || input.includes('mapping')) {
        return `**Oracle Data Type Mappings:**

**Common Mappings:**
- **Sybase VARCHAR → Oracle VARCHAR2**
- **Sybase INT → Oracle NUMBER**
- **Sybase DATETIME → Oracle DATE/TIMESTAMP**
- **Sybase MONEY → Oracle NUMBER(19,4)**
- **Sybase TEXT → Oracle CLOB**
- **Sybase IMAGE → Oracle BLOB**

**Oracle-Specific Types:**
- **VARCHAR2**: Variable-length character (max 4000 bytes)
- **NUMBER**: Numeric data (precision, scale)
- **DATE**: Date and time
- **TIMESTAMP**: High-precision date/time
- **CLOB**: Character large object
- **BLOB**: Binary large object

**Example Conversion:**
\`\`\`sql
-- Sybase
CREATE TABLE users (
    id INT,
    name VARCHAR(100),
    created_date DATETIME
);

-- Oracle equivalent
CREATE TABLE users (
    id NUMBER,
    name VARCHAR2(100),
    created_date DATE
);
\`\`\`

Would you like me to explain any specific data type conversion?`;
      }
    }

    // Python related questions
    if (input.includes('python')) {
      if (input.includes('basic') || input.includes('syntax')) {
        return `**Python Basics:**

**Variables and Data Types:**
\`\`\`python
# Numbers
age = 25
price = 19.99

# Strings
name = "John Doe"
message = 'Hello, World!'

# Lists
fruits = ["apple", "banana", "orange"]

# Dictionaries
person = {"name": "John", "age": 30}

# Booleans
is_active = True
\`\`\`

**Control Structures:**
\`\`\`python
# If statements
if age >= 18:
    print("Adult")
elif age >= 13:
    print("Teenager")
else:
    print("Child")

# Loops
for fruit in fruits:
    print(fruit)

for i in range(5):
    print(i)
\`\`\`

**Functions:**
\`\`\`python
def greet(name):
    return f"Hello, {name}!"

result = greet("Alice")
print(result)
\`\`\`

What specific Python topic would you like to learn more about?`;
      }
      
      if (input.includes('database') || input.includes('oracle') || input.includes('sql')) {
        return `**Python with Oracle Database:**

**Using cx_Oracle (Oracle Database Driver):**
\`\`\`python
import cx_Oracle
import os

# Set Oracle client path (Windows)
os.environ["PATH"] = "C:\\oracle\\instantclient_21_6;" + os.environ["PATH"]

# Connect to Oracle
connection = cx_Oracle.connect(
    user="username",
    password="password",
    dsn="localhost:1521/XE"
)

# Create cursor
cursor = connection.cursor()

# Execute query
cursor.execute("SELECT * FROM employees WHERE department_id = :dept_id", dept_id=10)

# Fetch results
for row in cursor:
    print(row)

# Close connections
cursor.close()
connection.close()
\`\`\`

**Using SQLAlchemy (ORM):**
\`\`\`python
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Create engine
engine = create_engine('oracle+cx_oracle://username:password@localhost:1521/XE')

# Create session
Session = sessionmaker(bind=engine)
session = Session()

# Execute query
result = session.execute(text("SELECT * FROM employees"))
for row in result:
    print(row)

session.close()
\`\`\`

Need help with a specific database operation?`;
      }
    }

    // Project-specific questions
    if (input.includes('project') || input.includes('migration') || input.includes('tool')) {
      if (input.includes('feature') || input.includes('what can') || input.includes('help')) {
        return `**Sybase to Oracle Migration Tool Features:**

**Core Capabilities:**
🚀 **AI-Powered Conversion**: Uses Gemini AI to convert Sybase SQL to Oracle PL/SQL
📁 **File Upload**: Support for multiple file formats (.sql, .txt, .zip)
🔍 **Code Analysis**: Detailed analysis of converted code with issue detection
📊 **Migration Reports**: Comprehensive reports with statistics and recommendations
💾 **Direct Deployment**: Option to deploy converted code directly to Oracle
📥 **Batch Download**: Download all converted files as a ZIP archive

**Supported Conversions:**
- **Stored Procedures**: Sybase T-SQL → Oracle PL/SQL
- **Functions**: Function syntax and logic conversion
- **Triggers**: Trigger syntax and event handling
- **Tables**: DDL statements and data type mappings
- **Views**: View definitions and query optimization

**AI Models Available:**
- **Gemini 2.5 Pro**: Advanced AI model for complex conversions
- **Default Model**: Standard conversion model

**Security Features:**
- User authentication and authorization
- Encrypted data handling
- Project isolation
- Audit trails

Would you like me to explain any specific feature in detail?`;
      }
      
      if (input.includes('how to') || input.includes('use') || input.includes('start')) {
        return `**How to Use the Migration Tool:**

**Step-by-Step Process:**

1. **Upload Files** 📁
   - Click "Upload Files" or drag & drop
   - Supported: .sql, .txt, .zip files
   - Files are analyzed and categorized

2. **Choose AI Model** 🤖
   - Select between Gemini 2.5 Pro or Default model
   - Gemini offers more advanced conversion capabilities

3. **Start Conversion** ⚡
   - Click "Convert All" or convert individual files
   - Monitor progress in real-time
   - Review conversion results

4. **Review & Fix** 🔍
   - Check converted code for issues
   - Use "Fix Issues" for automatic corrections
   - Manual editing available

5. **Generate Report** 📊
   - Create comprehensive migration report
   - Includes statistics, issues, and recommendations

6. **Download/Deploy** 💾
   - Download converted files as ZIP
   - Direct deployment to Oracle database (optional)

**Tips:**
- Start with smaller files to test the conversion
- Review converted code before deployment
- Use the report to understand changes made

Need help with any specific step?`;
      }
      
      if (input.includes('technology') || input.includes('built') || input.includes('stack')) {
        return `**Technology Stack:**

**Frontend:**
- **React 18**: Modern UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Beautiful component library
- **React Router**: Client-side routing

**Backend & Database:**
- **Supabase**: Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Row Level Security (RLS)
  - File storage

**AI Integration:**
- **Google Gemini AI**: Advanced AI model for code conversion
- **Custom prompts**: Optimized for SQL conversion

**Key Libraries:**
- **@google/generative-ai**: Gemini AI integration
- **@supabase/supabase-js**: Supabase client
- **@tanstack/react-query**: Data fetching and caching
- **react-hook-form**: Form handling
- **zod**: Schema validation
- **lucide-react**: Icon library

**Development Tools:**
- **ESLint**: Code linting
- **TypeScript**: Type checking
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixes

The project follows modern React patterns with TypeScript for type safety and Supabase for scalable backend services.`;
      }
    }

    // General questions about the bot
    if (input.includes('who are you') || input.includes('cosmo') || input.includes('agent')) {
      return `**About Cosmo Agents** 🤖✨

I'm Cosmo Agents, your AI assistant for the Sybase to Oracle Migration Tool! I'm here to help you with:

**My Expertise:**
🔹 **Oracle SQL & PL/SQL**: Syntax, best practices, data types, procedures, functions
🔹 **Python Programming**: Basics, database connectivity, web development
🔹 **Migration Tool**: Features, usage, troubleshooting, best practices
🔹 **Technical Support**: General programming questions and guidance

**What I Can Do:**
- Answer questions about Oracle database concepts
- Help with Python programming challenges
- Explain how to use the migration tool effectively
- Provide code examples and explanations
- Guide you through the migration process
- Troubleshoot common issues

**How to Use Me:**
Just ask me anything related to:
- "How do I write Oracle procedures?"
- "What are Python best practices?"
- "How does the migration tool work?"
- "What's the difference between Sybase and Oracle?"

I'm here to make your migration journey smoother! 🚀`;
    }

    // Default response for unrecognized queries
    return `I understand you're asking about "${userInput}". While I'm specialized in Oracle SQL, Python programming, and this migration tool, I can try to help with general technical questions.

**What I can help with:**
🔹 Oracle SQL syntax and best practices
🔹 Python programming concepts
🔹 How to use this Sybase to Oracle migration tool
🔹 Database concepts and migrations
🔹 General programming questions

Could you please rephrase your question or ask about one of these topics? I'm here to help! 😊`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    {
      label: "Oracle SQL Basics",
      question: "What are the basic Oracle SQL syntax differences from other databases?"
    },
    {
      label: "Python Database",
      question: "How do I connect Python to Oracle database?"
    },
    {
      label: "Migration Tool",
      question: "How do I use this migration tool?"
    },
    {
      label: "Data Types",
      question: "What are the Oracle data type mappings from Sybase?"
    }
  ];

  const handleQuickAction = (question: string) => {
    setInputValue(question);
    // Auto-send the question
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="w-96 h-[500px] shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Bot className="h-6 w-6" />
                  <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300" />
                </div>
                <div>
                  <CardTitle className="text-lg">Cosmo Agents</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs bg-white/20 text-white">
                      AI Assistant
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUseGemini(!useGemini)}
                      className="text-white hover:bg-white/20 h-6 px-2 text-xs"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      {useGemini ? 'Gemini' : 'Local'}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {!isMinimized && (
            <>
              <CardContent className="p-0 flex flex-col h-[400px]">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.sender === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-lg px-3 py-2",
                            message.sender === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          )}
                        >
                          {message.isLoading ? (
                            <div className="flex items-center space-x-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Cosmo is thinking...</span>
                            </div>
                          ) : (
                            <div className="text-sm whitespace-pre-wrap">
                              {message.content}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Quick Actions */}
                    {messages.length === 1 && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 text-center">Quick questions:</p>
                        <div className="flex flex-wrap gap-1">
                          {quickActions.map((action, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickAction(action.question)}
                              className="text-xs h-6 px-2"
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about Oracle SQL, Python, or the migration tool..."
                      className="flex-1"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      )}
    </div>
  );
};

export default CosmoChat; 
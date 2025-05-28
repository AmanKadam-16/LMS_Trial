import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Check, X, Award } from "lucide-react";
import { cn } from "@/lib/utils";

type QuizQuestion = {
  id: number;
  text: string;
  options: {
    id: number;
    text: string;
    isCorrect: boolean;
  }[];
};

type QuizData = {
  questions: QuizQuestion[];
};

interface QuizComponentProps {
  quizData: QuizData | string;
  onComplete?: (score: number, totalQuestions: number) => void;
}

export default function QuizComponent({ quizData, onComplete }: QuizComponentProps) {
  // Parse quiz data if it's a string
  const parsedQuizData: QuizData = typeof quizData === "string" 
    ? JSON.parse(quizData) 
    : quizData as QuizData;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [answers, setAnswers] = useState<{ questionId: number, selectedOption: number }[]>([]);
  const [score, setScore] = useState(0);

  const questions = parsedQuizData.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  useEffect(() => {
    // Initialize selected options array based on questions length
    setSelectedOptions(new Array(questions.length).fill(-1));
  }, [questions.length]);

  // Handle option selection
  const handleOptionSelect = (optionId: number) => {
    const newSelectedOptions = [...selectedOptions];
    newSelectedOptions[currentQuestionIndex] = optionId;
    setSelectedOptions(newSelectedOptions);
  };

  // Check if an option is selected
  const isOptionSelected = (optionId: number) => {
    return selectedOptions[currentQuestionIndex] === optionId;
  };

  // Move to the next question
  const handleNextQuestion = () => {
    // Save the answer
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      questionId: currentQuestion.id,
      selectedOption: selectedOptions[currentQuestionIndex]
    };
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered, calculate score
      let correctAnswers = 0;
      questions.forEach((question, index) => {
        const selectedOptionId = selectedOptions[index];
        const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
        if (selectedOption?.isCorrect) {
          correctAnswers++;
        }
      });

      setScore(correctAnswers);
      setShowResults(true);
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete(correctAnswers, questions.length);
      }
    }
  };

  // Move to the previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Check if the current question has an answer selected
  const hasSelectedOption = selectedOptions[currentQuestionIndex] !== -1;

  // Get the result for a specific question
  const getQuestionResult = (questionIndex: number) => {
    const question = questions[questionIndex];
    const selectedOptionId = selectedOptions[questionIndex];
    const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
    return selectedOption?.isCorrect;
  };

  // Handle quiz retry
  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setSelectedOptions(new Array(questions.length).fill(-1));
    setShowResults(false);
    setAnswers([]);
  };

  if (!questions || questions.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-gray-500">No questions available for this quiz.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      {!showResults ? (
        <>
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-sm font-medium">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <CardTitle className="mt-4">{currentQuestion.text}</CardTitle>
          </CardHeader>
          
          <CardContent>
            <RadioGroup value={selectedOptions[currentQuestionIndex]?.toString()} className="space-y-3">
              {currentQuestion.options.map((option) => (
                <div 
                  key={option.id} 
                  className={cn(
                    "flex items-center space-x-2 rounded-md border p-3 cursor-pointer transition-colors",
                    isOptionSelected(option.id) ? "border-primary bg-primary/5" : "hover:bg-gray-50"
                  )}
                  onClick={() => handleOptionSelect(option.id)}
                >
                  <RadioGroupItem 
                    value={option.id.toString()} 
                    id={`option-${option.id}`} 
                    checked={isOptionSelected(option.id)}
                  />
                  <Label 
                    htmlFor={`option-${option.id}`} 
                    className="flex-grow cursor-pointer"
                  >
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-6">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            
            <Button
              onClick={handleNextQuestion}
              disabled={!hasSelectedOption}
            >
              {currentQuestionIndex === questions.length - 1 ? "Finish Quiz" : "Next"}
            </Button>
          </CardFooter>
        </>
      ) : (
        <>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Quiz Results</CardTitle>
            <div className="mt-2 flex justify-center">
              <Award className="h-12 w-12 text-yellow-500" />
            </div>
            <div className="mt-2 text-center">
              <p className="text-2xl font-bold">
                {score} / {questions.length}
              </p>
              <p className="text-muted-foreground">
                {Math.round((score / questions.length) * 100)}% Score
              </p>
            </div>
          </CardHeader>
          
          <CardContent>
            <Progress 
              value={(score / questions.length) * 100} 
              className="h-2 mb-6"
            />
            <div 
              className={`h-2 mb-6 rounded-full -mt-8 ${
                score / questions.length >= 0.7 ? "bg-green-500" : 
                score / questions.length >= 0.4 ? "bg-yellow-500" : "bg-red-500"
              }`} 
              style={{ width: `${(score / questions.length) * 100}%` }}
            />
            
            <div className="space-y-4">
              <h3 className="font-medium">Question Review:</h3>
              <div className="space-y-3">
                {questions.map((question, index) => {
                  const isCorrect = getQuestionResult(index);
                  return (
                    <div 
                      key={question.id} 
                      className={cn(
                        "p-3 rounded-md border",
                        isCorrect ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className={cn(
                          "mt-0.5 rounded-full p-1",
                          isCorrect ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        )}>
                          {isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium">{question.text}</p>
                          <div className="mt-1 text-sm">
                            <p className="text-gray-500">Your answer: {
                              question.options.find(o => o.id === selectedOptions[index])?.text || "Not answered"
                            }</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-center border-t pt-6">
            <Button onClick={handleRetry}>Retry Quiz</Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
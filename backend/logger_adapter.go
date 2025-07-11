package main

import (
	"fmt"
	"time"
)

// LogLevel はログレベルを表す
type LogLevel int

const (
	DEBUG LogLevel = iota
	INFO
	WARN
	ERROR
	FATAL
)

// SimpleLogger はシンプルなロガーの実装
type SimpleLogger struct {
	level LogLevel
}

// NewLogger は新しいロガーを作成
func NewLogger(level LogLevel) *SimpleLogger {
	return &SimpleLogger{level: level}
}

// Debug はデバッグレベルのログを出力
func (l *SimpleLogger) Debug(msg string, fields ...interface{}) {
	if l.level <= DEBUG {
		l.log("DEBUG", msg, fields...)
	}
}

// Info は情報レベルのログを出力
func (l *SimpleLogger) Info(msg string, fields ...interface{}) {
	if l.level <= INFO {
		l.log("INFO", msg, fields...)
	}
}

// Warn は警告レベルのログを出力
func (l *SimpleLogger) Warn(msg string, fields ...interface{}) {
	if l.level <= WARN {
		l.log("WARN", msg, fields...)
	}
}

// Error はエラーレベルのログを出力
func (l *SimpleLogger) Error(msg string, fields ...interface{}) {
	if l.level <= ERROR {
		l.log("ERROR", msg, fields...)
	}
}

// Fatal は致命的エラーレベルのログを出力
func (l *SimpleLogger) Fatal(msg string, fields ...interface{}) {
	if l.level <= FATAL {
		l.log("FATAL", msg, fields...)
	}
}

// StartOperation は操作の開始を記録
func (l *SimpleLogger) StartOperation(operation string, input map[string]interface{}) *OperationTracker {
	l.Info(fmt.Sprintf("開始: %s", operation), "input", input)
	return &OperationTracker{
		Operation: operation,
		StartTime: time.Now(),
		Input:     input,
	}
}

// CompleteOperation は操作の完了を記録
func (l *SimpleLogger) CompleteOperation(tracker *OperationTracker, output map[string]interface{}) {
	duration := time.Since(tracker.StartTime)
	l.Info(fmt.Sprintf("完了: %s", tracker.Operation), 
		"duration", duration.String(),
		"input", tracker.Input,
		"output", output)
}

// ErrorOperation は操作のエラーを記録
func (l *SimpleLogger) ErrorOperation(tracker *OperationTracker, err error, resolution string) {
	duration := time.Since(tracker.StartTime)
	l.Error(fmt.Sprintf("エラー: %s", tracker.Operation),
		"error", err.Error(),
		"duration", duration.String(),
		"resolution", resolution,
		"input", tracker.Input)
}

// log は実際のログ出力を行う
func (l *SimpleLogger) log(level, msg string, fields ...interface{}) {
	timestamp := time.Now().Format("2006-01-02T15:04:05.000Z")
	
	// ベースメッセージ
	logMsg := fmt.Sprintf("[%s] %s: %s", timestamp, level, msg)
	
	// フィールドがある場合は追加
	if len(fields) > 0 {
		logMsg += " |"
		for i := 0; i < len(fields); i += 2 {
			if i+1 < len(fields) {
				logMsg += fmt.Sprintf(" %v=%v", fields[i], fields[i+1])
			}
		}
	}
	
	fmt.Println(logMsg)
}

// OperationTracker は操作を追跡する
type OperationTracker struct {
	Operation string
	StartTime time.Time
	Input     map[string]interface{}
}
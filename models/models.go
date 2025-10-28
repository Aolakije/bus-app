package models

import "time"

// GORM models

type Route struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	Name        string     `json:"name"`
	Description string     `json:"description,omitempty"`
	Stops       []Stop     `gorm:"constraint:OnDelete:CASCADE" json:"stops"`
	Schedules   []Schedule `gorm:"constraint:OnDelete:CASCADE" json:"schedules"`
	CreatedAt   time.Time  `json:"-"`
	UpdatedAt   time.Time  `json:"-"`
}

type Stop struct {
	ID         uint    `gorm:"primaryKey" json:"id"`
	RouteID    uint    `json:"-"`
	Name       string  `json:"name"`
	Latitude   float64 `json:"latitude"`
	Longitude  float64 `json:"longitude"`
	OrderIndex int     `json:"order_index"`
}

type Schedule struct {
	ID           uint   `gorm:"primaryKey" json:"id"`
	RouteID      uint   `json:"-"`
	Departure    string `json:"departure"`     // "06:30"
	FrequencyMin int    `json:"frequency_min"` // e.g. 30
}

type Admin struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Username string `gorm:"unique" json:"username"`
	Password string `json:"-"` // never exposed in JSON
}

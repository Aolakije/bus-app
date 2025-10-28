package seed

import (
	"busapp/handlers"
	"busapp/models"

	"gorm.io/gorm"
)

// MigrateAndSeed runs migrations and inserts sample data if empty
func MigrateAndSeed(db *gorm.DB) error {
	// Migrate
	if err := db.AutoMigrate(&models.Admin{}, &models.Route{}, &models.Stop{}, &models.Schedule{}); err != nil {
		return err
	}

	// Seed only if routes table empty
	var count int64
	if err := db.Model(&models.Route{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	var adminCount int64
	db.Model(&models.Admin{}).Count(&adminCount)
	if adminCount == 0 {
		db.Create(&models.Admin{Username: "admin", Password: handlers.HashPassword("admin123")})
	}

	// Example route: "Yaba–Ikeja"
	route := models.Route{
		Name:        "Yaba–Ikeja",
		Description: "Sample route via Ojuelegba and Maryland",
		Stops: []models.Stop{
			{Name: "Yaba", Latitude: 6.5086, Longitude: 3.3747, OrderIndex: 1},
			{Name: "Ojuelegba", Latitude: 6.5095, Longitude: 3.3664, OrderIndex: 2},
			{Name: "Maryland", Latitude: 6.5480, Longitude: 3.3632, OrderIndex: 3},
			{Name: "Ikeja", Latitude: 6.6014, Longitude: 3.3515, OrderIndex: 4},
		},
		Schedules: []models.Schedule{
			{Departure: "06:30", FrequencyMin: 30},
			{Departure: "07:00", FrequencyMin: 30},
		},
	}

	if err := db.Create(&route).Error; err != nil {
		return err
	}

	// (Optional) create more routes here...
	return nil
}

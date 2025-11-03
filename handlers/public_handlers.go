package handlers

import (
	"fmt"
	"net/http"
	"time"

	"busapp/models"
	"busapp/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Get all routes (public)
func PublicGetRoutesHandler(c *gin.Context, db *gorm.DB) {
	var routes []models.Route
	if err := db.Preload("Stops").Preload("Schedules").Find(&routes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch routes"})
		return
	}
	c.JSON(http.StatusOK, routes)
}

// Get route details by ID (public)
func PublicGetRouteByIDHandler(c *gin.Context, db *gorm.DB) {
	id := c.Param("id")
	var route models.Route

	if err := db.Preload("Stops").Preload("Schedules").First(&route, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "route not found"})
		return
	}
	c.JSON(http.StatusOK, route)
}

// Get next bus time for a route (public)
func PublicGetNextBusHandler(c *gin.Context, db *gorm.DB) {
	id := c.Param("id")

	var route models.Route
	if err := db.Preload("Stops").Preload("Schedules").First(&route, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "route not found"})
		return
	}

	if len(route.Schedules) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "no schedules for this route"})
		return
	}

	// For simplicity, we take the first schedule
	schedule := route.Schedules[0]
	now := time.Now()

	// Parse schedule departure time
	depTime, err := time.Parse("15:04", schedule.Departure)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid schedule format"})
		return
	}

	// Compute first bus today
	firstBus := time.Date(now.Year(), now.Month(), now.Day(),
		depTime.Hour(), depTime.Minute(), 0, 0, now.Location())

	// Find the next bus after current time
	nextBusTime := firstBus
	for nextBusTime.Before(now) {
		nextBusTime = nextBusTime.Add(time.Minute * time.Duration(schedule.FrequencyMin))
	}

	// --- Generate multiple buses ---
	busCount := 4 // number of upcoming buses
	averageSpeedKmH := 25.0
	buses := []map[string]interface{}{}

	for i := 0; i < busCount; i++ {
		departure := firstBus.Add(time.Duration(i*schedule.FrequencyMin) * time.Minute)

		// Compute ETAs for each stop
		busETAs := []map[string]string{}
		arrival := departure
		for j := 0; j < len(route.Stops); j++ {
			if j > 0 {
				prev := route.Stops[j-1]
				curr := route.Stops[j]
				distKm := utils.Haversine(prev.Latitude, prev.Longitude, curr.Latitude, curr.Longitude)
				travelMinutes := (distKm / averageSpeedKmH) * 60
				arrival = arrival.Add(time.Duration(travelMinutes) * time.Minute)
			}
			busETAs = append(busETAs, map[string]string{
				"stop": route.Stops[j].Name,
				"eta":  arrival.Format("15:04"),
			})
		}

		buses = append(buses, map[string]interface{}{
			"departure": departure.Format("15:04"),
			"etas":      busETAs,
		})
	}

	// Return JSON response
	c.JSON(http.StatusOK, gin.H{
		"route_id":     id,
		"route_name":   route.Name,
		"current_time": now.Format("15:04"),
		"next_bus":     nextBusTime.Format("15:04"),
		"frequency":    fmt.Sprintf("%d min", schedule.FrequencyMin),
		"buses":        buses,
	})
}

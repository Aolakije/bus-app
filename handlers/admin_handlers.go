package handlers

import (
	"net/http"
	"strconv"

	"busapp/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

/*
Admin endpoints added:
- POST   /admin/routes            -> create route (+ optional stops & schedules)
- PUT    /admin/routes/:id        -> update route (name/description)
- DELETE /admin/routes/:id        -> delete route (cascade deletes stops & schedules)

- POST   /admin/routes/:id/stops  -> add stop to route
- PUT    /admin/stops/:id         -> update stop
- DELETE /admin/stops/:id        -> delete stop

- POST   /admin/routes/:id/schedules -> add schedule to route
- PUT    /admin/schedules/:id        -> update schedule
- DELETE /admin/schedules/:id       -> delete schedule
*/

// Payloads
type CreateRoutePayload struct {
	Name        string               `json:"name" binding:"required"`
	Description string               `json:"description"`
	Stops       []CreateStopPayload  `json:"stops,omitempty"`
	Schedules   []CreateScheduleBody `json:"schedules,omitempty"`
}

type CreateStopPayload struct {
	Name       string  `json:"name" binding:"required"`
	Latitude   float64 `json:"latitude" binding:"required"`
	Longitude  float64 `json:"longitude" binding:"required"`
	OrderIndex int     `json:"order_index"`
}

type CreateScheduleBody struct {
	Departure    string `json:"departure" binding:"required"`     // "06:30"
	FrequencyMin int    `json:"frequency_min" binding:"required"` // 30
}

// CreateRouteHandler - creates route with optional stops and schedules
func CreateRouteHandler(c *gin.Context, db *gorm.DB) {
	var payload CreateRoutePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	route := models.Route{
		Name:        payload.Name,
		Description: payload.Description,
	}

	// build stops and schedules
	for _, s := range payload.Stops {
		route.Stops = append(route.Stops, models.Stop{
			Name:       s.Name,
			Latitude:   s.Latitude,
			Longitude:  s.Longitude,
			OrderIndex: s.OrderIndex,
		})
	}
	for _, sch := range payload.Schedules {
		route.Schedules = append(route.Schedules, models.Schedule{
			Departure:    sch.Departure,
			FrequencyMin: sch.FrequencyMin,
		})
	}

	if err := db.Create(&route).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create route"})
		return
	}
	c.JSON(http.StatusCreated, route)
}

// UpdateRouteHandler - updates simple route fields
func UpdateRouteHandler(c *gin.Context, db *gorm.DB) {
	idStr := c.Param("id")
	id, _ := strconv.Atoi(idStr)

	var payload struct {
		Name        *string `json:"name"`
		Description *string `json:"description"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var route models.Route
	if err := db.First(&route, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "route not found"})
		return
	}

	if payload.Name != nil {
		route.Name = *payload.Name
	}
	if payload.Description != nil {
		route.Description = *payload.Description
	}

	if err := db.Save(&route).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update route"})
		return
	}
	c.JSON(http.StatusOK, route)
}

// DeleteRouteHandler - deletes a route (cascade deletes stops/schedules by GORM constraints)
func DeleteRouteHandler(c *gin.Context, db *gorm.DB) {
	idStr := c.Param("id")
	id, _ := strconv.Atoi(idStr)

	if err := db.Delete(&models.Route{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete route"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

// AddStopHandler - add stop to a route
func AddStopHandler(c *gin.Context, db *gorm.DB) {
	routeIDstr := c.Param("id")
	routeID, _ := strconv.Atoi(routeIDstr)

	var payload CreateStopPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Ensure route exists
	var route models.Route
	if err := db.First(&route, routeID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "route not found"})
		return
	}

	stop := models.Stop{
		RouteID:    uint(routeID),
		Name:       payload.Name,
		Latitude:   payload.Latitude,
		Longitude:  payload.Longitude,
		OrderIndex: payload.OrderIndex,
	}
	if err := db.Create(&stop).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create stop"})
		return
	}
	c.JSON(http.StatusCreated, stop)
}

// UpdateStopHandler - update stop record
func UpdateStopHandler(c *gin.Context, db *gorm.DB) {
	idStr := c.Param("id")
	id, _ := strconv.Atoi(idStr)

	var payload struct {
		Name       *string  `json:"name"`
		Latitude   *float64 `json:"latitude"`
		Longitude  *float64 `json:"longitude"`
		OrderIndex *int     `json:"order_index"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var stop models.Stop
	if err := db.First(&stop, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "stop not found"})
		return
	}

	if payload.Name != nil {
		stop.Name = *payload.Name
	}
	if payload.Latitude != nil {
		stop.Latitude = *payload.Latitude
	}
	if payload.Longitude != nil {
		stop.Longitude = *payload.Longitude
	}
	if payload.OrderIndex != nil {
		stop.OrderIndex = *payload.OrderIndex
	}

	if err := db.Save(&stop).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update stop"})
		return
	}
	c.JSON(http.StatusOK, stop)
}

// DeleteStopHandler - remove stop
func DeleteStopHandler(c *gin.Context, db *gorm.DB) {
	idStr := c.Param("id")
	id, _ := strconv.Atoi(idStr)

	if err := db.Delete(&models.Stop{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete stop"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

// AddScheduleHandler - add schedule to a route
func AddScheduleHandler(c *gin.Context, db *gorm.DB) {
	routeIDstr := c.Param("id")
	routeID, _ := strconv.Atoi(routeIDstr)

	var payload CreateScheduleBody
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ensure route
	var route models.Route
	if err := db.First(&route, routeID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "route not found"})
		return
	}

	sch := models.Schedule{
		RouteID:      uint(routeID),
		Departure:    payload.Departure,
		FrequencyMin: payload.FrequencyMin,
	}
	if err := db.Create(&sch).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create schedule"})
		return
	}
	c.JSON(http.StatusCreated, sch)
}

// UpdateScheduleHandler - update schedule
func UpdateScheduleHandler(c *gin.Context, db *gorm.DB) {
	idStr := c.Param("id")
	id, _ := strconv.Atoi(idStr)

	var payload struct {
		Departure    *string `json:"departure"`
		FrequencyMin *int    `json:"frequency_min"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var sch models.Schedule
	if err := db.First(&sch, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "schedule not found"})
		return
	}

	if payload.Departure != nil {
		sch.Departure = *payload.Departure
	}
	if payload.FrequencyMin != nil {
		sch.FrequencyMin = *payload.FrequencyMin
	}
	if err := db.Save(&sch).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update schedule"})
		return
	}
	c.JSON(http.StatusOK, sch)
}

// DeleteScheduleHandler - remove schedule
func DeleteScheduleHandler(c *gin.Context, db *gorm.DB) {
	idStr := c.Param("id")
	id, _ := strconv.Atoi(idStr)

	if err := db.Delete(&models.Schedule{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete schedule"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

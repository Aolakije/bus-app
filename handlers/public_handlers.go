package handlers

import (
	"net/http"

	"busapp/models"

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

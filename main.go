package main

import (
	"log"

	"busapp/db"
	"busapp/handlers"
	"busapp/middleware"
	"busapp/seed"

	"github.com/gin-gonic/gin"
)

func main() {
	// Init DB (creates sqlite file bus.db)
	db, err := db.InitDB("bus.db")
	if err != nil {
		log.Fatalf("failed to init db: %v", err)
	}
	// Auto-migrate models & seed sample data
	if err := seed.MigrateAndSeed(db); err != nil {
		log.Fatalf("migrate/seed error: %v", err)
	}

	r := gin.Default()
	r.Use(middleware.CorsMiddleware())

	// Auth routes
	r.POST("/auth/register", func(c *gin.Context) { handlers.RegisterHandler(c, db) })
	r.POST("/auth/login", func(c *gin.Context) { handlers.LoginHandler(c, db) })

	// Public endpoints
	r.GET("/routes", func(c *gin.Context) { handlers.GetRoutesHandler(c, db) })
	r.GET("/routes/:id", func(c *gin.Context) { handlers.GetRouteByIDHandler(c, db) })
	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })

	// Admin (protected)
	admin := r.Group("/admin")
	admin.Use(middleware.AuthMiddleware()) // JWT required

	admin.POST("/routes", func(c *gin.Context) { handlers.CreateRouteHandler(c, db) })
	admin.PUT("/routes/:id", func(c *gin.Context) { handlers.UpdateRouteHandler(c, db) })
	admin.DELETE("/routes/:id", func(c *gin.Context) { handlers.DeleteRouteHandler(c, db) })

	admin.POST("/routes/:id/stops", func(c *gin.Context) { handlers.AddStopHandler(c, db) })
	admin.PUT("/stops/:id", func(c *gin.Context) { handlers.UpdateStopHandler(c, db) })
	admin.DELETE("/stops/:id", func(c *gin.Context) { handlers.DeleteStopHandler(c, db) })

	admin.POST("/routes/:id/schedules", func(c *gin.Context) { handlers.AddScheduleHandler(c, db) })
	admin.PUT("/schedules/:id", func(c *gin.Context) { handlers.UpdateScheduleHandler(c, db) })
	admin.DELETE("/schedules/:id", func(c *gin.Context) { handlers.DeleteScheduleHandler(c, db) })

	log.Println("Server running on :8080")
	log.Println("click http://localhost:8080/health to check STATUS")
	log.Println("press Ctrl+C to stop")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
